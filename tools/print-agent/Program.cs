using System;
using System.Collections.Concurrent;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace AcaiDaRose.PrintAgent;

public static class Program
{
    private static AgentConfig _config = null!;
    private static string _configPath = "";
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(10) };
    private static readonly object _printLock = new();
    private static MainForm? _mainForm;
    private static string _currentStoreName = "Não vinculada";
    private static readonly object _logFileLock = new();
    private static string _logFilePath = "";

    [STAThread]
    public static void Main(string[] args)
    {
        // 1. Suporte a codificações de páginas de código do Windows (Windows-1252 / CP850 com Euro €)
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

        // 2. Configurações visuais do Windows Forms
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        _configPath = GetConfigFilePath();
        _config = LoadOrCreateConfig(_configPath);

        // Inicializa arquivo de log local com retenção diária
        InitializeLogger();

        bool startMinimized = args.Any(a => a.Equals("--minimized", StringComparison.OrdinalIgnoreCase) || a.Equals("--tray", StringComparison.OrdinalIgnoreCase));

        // 3. Inicializa Servidor Kestrel Local (Porta 4040 ou configurada)
        var builder = WebApplication.CreateBuilder(args);
        int port = _config.LocalPort > 0 ? _config.LocalPort : 4040;
        builder.WebHost.UseUrls($"http://127.0.0.1:{port}", $"http://localhost:{port}");

        var app = builder.Build();

        // Middleware CORS total + Private Network Access (PNA) do Google Chrome / Edge
        app.Use(async (context, next) =>
        {
            var origin = context.Request.Headers.Origin.ToString();
            context.Response.Headers.Append("Access-Control-Allow-Origin", string.IsNullOrEmpty(origin) ? "*" : origin);
            context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
            context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");

            if (context.Request.Headers.ContainsKey("Access-Control-Request-Private-Network"))
            {
                context.Response.Headers.Append("Access-Control-Allow-Private-Network", "true");
            }

            if (context.Request.Method == "OPTIONS")
            {
                context.Response.StatusCode = 204;
                return;
            }

            await next();
        });

        // Endpoint 1: Diagnóstico de Status
        app.MapGet("/status", () => Results.Ok(new
        {
            status = "online",
            service = "Açaí da Rose Print Agent",
            version = "1.0.0",
            machine = Environment.MachineName,
            storeToken = _config.StoreToken,
            storeName = _currentStoreName,
            apiUrl = _config.ApiUrl,
            pollIntervalMs = _config.PollIntervalMs,
            timestamp = DateTime.UtcNow
        }));

        // Endpoint 2: Listagem de Impressoras do Windows
        app.MapGet("/printers", () =>
        {
            try
            {
                var printersList = new List<string>();
                foreach (string printer in PrinterSettings.InstalledPrinters)
                {
                    printersList.Add(printer);
                }

                string defaultPrinter = "";
                try
                {
                    defaultPrinter = new PrinterSettings().PrinterName;
                }
                catch { }

                return Results.Ok(new
                {
                    success = true,
                    printers = printersList,
                    defaultPrinter
                });
            }
            catch (Exception ex)
            {
                return Results.Json(new
                {
                    success = false,
                    error = $"Erro ao listar impressoras: {ex.Message}",
                    printers = Array.Empty<string>()
                }, statusCode: 500);
            }
        });

        // Endpoint 3: Atualização de Configuração em 1 Clique direto pelo Painel Web
        app.MapPost("/config", async (HttpContext context) =>
        {
            try
            {
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8);
                var body = await reader.ReadToEndAsync();
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (root.TryGetProperty("storeToken", out var tokenEl))
                {
                    _config.StoreToken = tokenEl.GetString()?.Trim() ?? "";
                }
                if (root.TryGetProperty("apiUrl", out var apiEl) && !string.IsNullOrWhiteSpace(apiEl.GetString()))
                {
                    _config.ApiUrl = apiEl.GetString()!.Trim().TrimEnd('/');
                }
                if (root.TryGetProperty("pollIntervalMs", out var pollEl))
                {
                    _config.PollIntervalMs = Math.Max(1000, pollEl.GetInt32());
                }

                SaveConfig(_configPath, _config);

                if (!string.IsNullOrEmpty(_config.StoreToken))
                {
                    var syncResult = await SyncWithStore(_httpClient, _config.ApiUrl, _config.StoreToken);
                    if (syncResult.success && syncResult.storeName != null)
                    {
                        if (!string.IsNullOrEmpty(syncResult.effectiveUrl))
                        {
                            _config.ApiUrl = syncResult.effectiveUrl;
                            SaveConfig(_configPath, _config);
                        }
                        _currentStoreName = syncResult.storeName;
                        _mainForm?.UpdateStoreStatus(_currentStoreName);
                    }
                }

                _mainForm?.AppendLog($"Configuração atualizada via Painel Web (Token: {_config.StoreToken})", Color.FromArgb(16, 185, 129));

                return Results.Ok(new
                {
                    success = true,
                    message = "Configuração do Agente atualizada com sucesso!",
                    storeToken = _config.StoreToken,
                    storeName = _currentStoreName,
                    apiUrl = _config.ApiUrl
                });
            }
            catch (Exception ex)
            {
                return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
            }
        });

        // Endpoint 4: Impressão Manual Local Direta
        app.MapPost("/print", async (HttpContext context) =>
        {
            try
            {
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8);
                var body = await reader.ReadToEndAsync();
                if (string.IsNullOrWhiteSpace(body))
                {
                    return Results.BadRequest(new { success = false, error = "Corpo da requisição vazio." });
                }

                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (!root.TryGetProperty("printerName", out var printerNameEl) || string.IsNullOrWhiteSpace(printerNameEl.GetString()))
                {
                    return Results.BadRequest(new { success = false, error = "Campo 'printerName' é obrigatório." });
                }

                string printerName = printerNameEl.GetString()!;
                string docName = root.TryGetProperty("docName", out var docNameEl) ? (docNameEl.GetString() ?? "Açaí da Rose - Cupom") : "Açaí da Rose - Cupom";
                int copies = root.TryGetProperty("copies", out var copiesEl) ? Math.Max(1, copiesEl.GetInt32()) : 1;

                byte[] printBytes = Array.Empty<byte>();

                if (root.TryGetProperty("rawBase64", out var base64El) && !string.IsNullOrWhiteSpace(base64El.GetString()))
                {
                    printBytes = Convert.FromBase64String(base64El.GetString()!);
                }
                else if (root.TryGetProperty("rawText", out var textEl) && !string.IsNullOrWhiteSpace(textEl.GetString()))
                {
                    var win1252 = Encoding.GetEncoding(1252);
                    printBytes = win1252.GetBytes(textEl.GetString()!);
                }
                else
                {
                    return Results.BadRequest(new { success = false, error = "Nenhum dado fornecido ('rawBase64' ou 'rawText')." });
                }

                bool overallSuccess = true;
                string? lastError = null;

                lock (_printLock)
                {
                    for (int i = 0; i < copies; i++)
                    {
                        var (success, error) = RawPrinterHelper.SendBytesToPrinter(printerName, printBytes, docName);
                        if (!success)
                        {
                            overallSuccess = false;
                            lastError = error;
                            break;
                        }
                        Thread.Sleep(30);
                    }
                }

                if (!overallSuccess)
                {
                    LogMessage($"[ERRO LOCAL] Impressora '{printerName}': {lastError}", "ERROR", Color.Red, "PRINT_LOCAL_ERROR", new { printer = printerName, error = lastError });
                    return Results.Json(new { success = false, error = lastError, printerName }, statusCode: 500);
                }

                LogMessage($"[SUCESSO LOCAL] {docName} em '{printerName}' ({printBytes.Length} bytes, {copies} via(s))", "INFO", Color.FromArgb(16, 185, 129), "PRINT_LOCAL_SUCCESS", new { printer = printerName, doc = docName, copies });
                return Results.Ok(new { success = true, printerName, bytesPrinted = printBytes.Length, copies });
            }
            catch (Exception ex)
            {
                return Results.Json(new { success = false, error = ex.Message }, statusCode: 500);
            }
        });

        // 4. Inicia Servidor Web em Background
        _ = app.StartAsync();

        // 5. Inicia Polling de Fila de Impressão na Nuvem em Background
        StartCloudPollingLoop();

        // 6. Instancia Formulário Principal com Design System Açaí da Rose
        _mainForm = new MainForm(
            _config,
            onConfigSaved: (newCfg) =>
            {
                _config = newCfg;
                SaveConfig(_configPath, _config);
            },
            onSyncStore: (token) =>
            {
                var res = Task.Run(() => SyncWithStore(_httpClient, _config.ApiUrl, token)).GetAwaiter().GetResult();
                if (res.success && !string.IsNullOrEmpty(res.effectiveUrl))
                {
                    _config.ApiUrl = res.effectiveUrl;
                    _config.StoreToken = token;
                    SaveConfig(_configPath, _config);
                }
                return (res.success, res.storeName);
            },
            onTestPrint: (printerName) =>
            {
                DoTestPrint(printerName);
            },
            onOpenLogs: () =>
            {
                OpenLogsFolder();
            },
            onLogRecorded: (msg, lvl, col, act, meta) =>
            {
                LogMessage(msg, lvl, col, act, meta);
            },
            startMinimized: startMinimized && !string.IsNullOrWhiteSpace(_config.StoreToken)
        );

        // 7. Roda Loop de Mensagens da Interface Gráfica
        Application.Run(_mainForm);

        // 8. Finalização limpa
        try
        {
            app.StopAsync().GetAwaiter().GetResult();
        }
        catch { }
    }

    private static void StartCloudPollingLoop()
    {
        _ = Task.Run(async () =>
        {
            while (true)
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(_config.StoreToken) && !string.IsNullOrWhiteSpace(_config.ApiUrl))
                    {
                        if (_currentStoreName == "Não vinculada")
                        {
                            var syncRes = await SyncWithStore(_httpClient, _config.ApiUrl, _config.StoreToken);
                            if (syncRes.success && syncRes.storeName != null)
                            {
                                if (!string.IsNullOrEmpty(syncRes.effectiveUrl))
                                {
                                    _config.ApiUrl = syncRes.effectiveUrl;
                                    SaveConfig(_configPath, _config);
                                }
                                _currentStoreName = syncRes.storeName;
                                _mainForm?.UpdateStoreStatus(_currentStoreName);
                                LogMessage($"[NUVEM] Conectado à loja: {_currentStoreName} ({_config.ApiUrl})", "INFO", Color.FromArgb(16, 185, 129), "STORE_ONLINE", new { store = _currentStoreName, url = _config.ApiUrl });
                            }
                        }

                        string jobsUrl = $"{_config.ApiUrl.TrimEnd('/')}/api/printers/agent/jobs?token={Uri.EscapeDataString(_config.StoreToken)}";
                        var response = await _httpClient.GetAsync(jobsUrl);

                        if (response.IsSuccessStatusCode)
                        {
                            var result = await response.Content.ReadFromJsonAsync<PendingJobsResponse>();
                            if (result?.Jobs != null && result.Jobs.Count > 0)
                            {
                                foreach (var job in result.Jobs)
                                {
                                    LogMessage($"[NOVO PEDIDO NUVEM] Comanda #{job.OrderNumber} para '{job.PrinterName}'...", "INFO", Color.FromArgb(216, 180, 254), "JOB_DISPATCHED", new { order = job.OrderNumber, printer = job.PrinterName });

                                    byte[] bytes = Array.Empty<byte>();
                                    if (!string.IsNullOrEmpty(job.PayloadBase64))
                                    {
                                        bytes = Convert.FromBase64String(job.PayloadBase64);
                                    }
                                    else if (!string.IsNullOrEmpty(job.PayloadText))
                                    {
                                        var win1252 = Encoding.GetEncoding(1252);
                                        bytes = win1252.GetBytes(job.PayloadText);
                                    }

                                    bool printOk = false;
                                    string? err = null;

                                    if (bytes.Length > 0)
                                    {
                                        lock (_printLock)
                                        {
                                            int copies = Math.Max(1, job.Copies);
                                            for (int c = 0; c < copies; c++)
                                            {
                                                var res = RawPrinterHelper.SendBytesToPrinter(job.PrinterName, bytes, $"Pedido #{job.OrderNumber}");
                                                printOk = res.Success;
                                                err = res.Error;
                                                if (!printOk) break;
                                                Thread.Sleep(30);
                                            }
                                        }
                                    }

                                    string ackUrl = $"{_config.ApiUrl.TrimEnd('/')}/api/printers/agent/ack?token={Uri.EscapeDataString(_config.StoreToken)}";
                                    await _httpClient.PostAsJsonAsync(ackUrl, new
                                    {
                                        jobId = job.Id,
                                        status = printOk ? "PRINTED" : "FAILED",
                                        error = err
                                    });

                                    if (printOk)
                                    {
                                        LogMessage($"[IMPRESSO COM SUCESSO] Pedido #{job.OrderNumber} em '{job.PrinterName}'", "INFO", Color.FromArgb(16, 185, 129), "JOB_PRINTED_SUCCESS", new { order = job.OrderNumber, printer = job.PrinterName });
                                    }
                                    else
                                    {
                                        LogMessage($"[FALHA NA IMPRESSÃO] Pedido #{job.OrderNumber}: {err}", "ERROR", Color.Red, "JOB_PRINT_FAILED", new { order = job.OrderNumber, error = err, printer = job.PrinterName });
                                    }
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // Silencia falhas transitórias de conexão de rede
                }

                await Task.Delay(Math.Max(1500, _config.PollIntervalMs));
            }
        });
    }

    private static void DoTestPrint(string printerName)
    {
        try
        {
            byte[] testBytes = BuildTestReceipt();
            var (ok, err) = RawPrinterHelper.SendBytesToPrinter(printerName, testBytes, "Açaí da Rose - Teste");
            if (ok)
            {
                LogMessage($"[TESTE OK] Impresso com sucesso em '{printerName}'!", "INFO", Color.FromArgb(16, 185, 129), "TEST_PRINT_SUCCESS", new { printer = printerName });
            }
            else
            {
                LogMessage($"[FALHA NO TESTE] Impressora '{printerName}': {err}", "ERROR", Color.Red, "TEST_PRINT_FAILED", new { printer = printerName, error = err });
            }
        }
        catch (Exception ex)
        {
            LogMessage($"[ERRO NO TESTE] {ex.Message}", "ERROR", Color.Red, "TEST_PRINT_ERROR", new { error = ex.Message });
        }
    }

    private static byte[] BuildTestReceipt()
    {
        using var ms = new MemoryStream();
        var win1252 = Encoding.GetEncoding(1252);

        // Inicializa impressora (ESC @)
        ms.Write(new byte[] { 0x1B, 0x40 });
        // Tabela de caracteres Windows-1252 (ESC t 16)
        ms.Write(new byte[] { 0x1B, 0x74, 0x10 });

        // Centralizado
        ms.Write(new byte[] { 0x1B, 0x61, 0x01 });
        // Negrito ON
        ms.Write(new byte[] { 0x1B, 0x45, 0x01 });
        // Fonte dupla altura + largura (GS ! 0x11)
        ms.Write(new byte[] { 0x1D, 0x21, 0x11 });
        ms.Write(win1252.GetBytes("AÇAI DA ROSE\n"));

        // Fonte normal (GS ! 0x00)
        ms.Write(new byte[] { 0x1D, 0x21, 0x00 });
        ms.Write(new byte[] { 0x1B, 0x45, 0x00 });
        ms.Write(win1252.GetBytes("SERVIDOR DE IMPRESSAO WINDOWS\n"));
        ms.Write(win1252.GetBytes("--------------------------------\n"));

        // Alinhamento à esquerda (ESC a 0)
        ms.Write(new byte[] { 0x1B, 0x61, 0x00 });
        ms.Write(win1252.GetBytes($"Data/Hora: {DateTime.Now:dd/MM/yyyy HH:mm:ss}\n"));
        ms.Write(win1252.GetBytes($"Computador: {Environment.MachineName}\n"));
        ms.Write(win1252.GetBytes("Porta Local: 4040 (HTTP/JSON)\n"));
        ms.Write(win1252.GetBytes("Driver: Win32 Raw Spooler (ESC/POS)\n"));
        ms.Write(win1252.GetBytes("PNA Chrome/Edge: Habilitado\n"));
        ms.Write(win1252.GetBytes("--------------------------------\n"));

        // Centralizado
        ms.Write(new byte[] { 0x1B, 0x61, 0x01 });
        ms.Write(new byte[] { 0x1B, 0x45, 0x01 });
        ms.Write(win1252.GetBytes("TESTE DE COMUNICACAO OK!\n"));
        ms.Write(new byte[] { 0x1B, 0x45, 0x00 });
        ms.Write(win1252.GetBytes("Pronto para impressao de comandas.\n\n\n\n"));

        // Corte parcial de papel (GS V 66 0)
        ms.Write(new byte[] { 0x1D, 0x56, 0x42, 0x00 });

        return ms.ToArray();
    }

    private static string GetConfigFilePath()
    {
        string localPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
        try
        {
            if (File.Exists(localPath))
            {
                using (var fs = File.Open(localPath, FileMode.Open, FileAccess.ReadWrite)) { }
                return localPath;
            }

            string testFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".test_write.tmp");
            File.WriteAllText(testFile, "test");
            File.Delete(testFile);
            return localPath;
        }
        catch
        {
            string appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AcaidaRose-PrintAgent");
            if (!Directory.Exists(appDataDir))
            {
                try { Directory.CreateDirectory(appDataDir); } catch { }
            }
            return Path.Combine(appDataDir, "config.json");
        }
    }

    private static AgentConfig LoadOrCreateConfig(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                var json = File.ReadAllText(path, Encoding.UTF8);
                var parsed = JsonSerializer.Deserialize<AgentConfig>(json);
                if (parsed != null) return parsed;
            }
        }
        catch { }

        var def = new AgentConfig();
        SaveConfig(path, def);
        return def;
    }

    private static void SaveConfig(string path, AgentConfig conf)
    {
        try
        {
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(conf, options);
            File.WriteAllText(path, json, Encoding.UTF8);
        }
        catch { }
    }

    public static void InitializeLogger()
    {
        try
        {
            string logDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logs");
            if (!Directory.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
            }
            _logFilePath = Path.Combine(logDir, $"print-agent-{DateTime.Now:yyyy-MM-dd}.log");
            File.AppendAllText(_logFilePath, $"--- [SESSÃO INICIADA {DateTime.Now:yyyy-MM-dd HH:mm:ss}] Computador: {Environment.MachineName} ---" + Environment.NewLine, Encoding.UTF8);
        }
        catch
        {
            string appDataLogs = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AcaidaRose-PrintAgent", "logs");
            try { Directory.CreateDirectory(appDataLogs); } catch { }
            _logFilePath = Path.Combine(appDataLogs, $"print-agent-{DateTime.Now:yyyy-MM-dd}.log");
            try
            {
                File.AppendAllText(_logFilePath, $"--- [SESSÃO INICIADA {DateTime.Now:yyyy-MM-dd HH:mm:ss}] Computador: {Environment.MachineName} ---" + Environment.NewLine, Encoding.UTF8);
            }
            catch { }
        }
    }

    public static void LogMessage(string message, string level = "INFO", Color? color = null, string? action = null, object? metadata = null)
    {
        _mainForm?.AppendLog(message, color);

        try
        {
            lock (_logFileLock)
            {
                if (!string.IsNullOrEmpty(_logFilePath))
                {
                    string entry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{level.ToUpper()}] {message}";
                    File.AppendAllText(_logFilePath, entry + Environment.NewLine, Encoding.UTF8);
                }
            }
        }
        catch { }

        if (!string.IsNullOrWhiteSpace(_config.StoreToken) && !string.IsNullOrWhiteSpace(_config.ApiUrl))
        {
            _ = SendLogToDevMasterAsync(message, level, action, metadata);
        }
    }

    private static async Task SendLogToDevMasterAsync(string message, string level, string? action, object? metadata)
    {
        try
        {
            string url = $"{_config.ApiUrl.TrimEnd('/')}/api/dev/audit-logs";
            var payload = new
            {
                tenantId = _config.StoreToken,
                authorName = $"Servidor Windows ({Environment.MachineName})",
                userRole = "PRINT_AGENT",
                action = action ?? "PRINT_AGENT_EVENT",
                entity = "IMPRESSORAS_WINDOWS",
                message = message,
                level = level.ToUpper(),
                metadata = metadata ?? new { machine = Environment.MachineName, store = _currentStoreName }
            };
            await _httpClient.PostAsJsonAsync(url, payload);
        }
        catch { }
    }

    public static void OpenLogsFolder()
    {
        try
        {
            string? dir = Path.GetDirectoryName(_logFilePath);
            if (string.IsNullOrEmpty(dir) || !Directory.Exists(dir))
            {
                dir = AppDomain.CurrentDomain.BaseDirectory;
            }
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = dir,
                UseShellExecute = true,
                Verb = "open"
            });
        }
        catch { }
    }

    private static async Task<(bool success, string? storeName, string? effectiveUrl)> SyncWithStore(HttpClient client, string apiUrl, string token)
    {
        var candidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(apiUrl)) candidates.Add(apiUrl.TrimEnd('/'));
        if (!candidates.Contains("https://app.acaidarose.pt")) candidates.Add("https://app.acaidarose.pt");
        if (!candidates.Contains("http://localhost:3000")) candidates.Add("http://localhost:3000");

        foreach (var candidate in candidates)
        {
            try
            {
                string syncUrl = $"{candidate}/api/printers/agent/sync?token={Uri.EscapeDataString(token)}";
                var res = await client.GetAsync(syncUrl);
                if (res.IsSuccessStatusCode)
                {
                    var data = await res.Content.ReadFromJsonAsync<StoreSyncResponse>();
                    if (data?.Success == true && data.Tenant != null)
                    {
                        return (true, data.Tenant.Name, candidate);
                    }
                }
            }
            catch { }
        }
        return (false, null, null);
    }
}

public class AgentConfig
{
    [JsonPropertyName("apiUrl")]
    public string ApiUrl { get; set; } = "https://app.acaidarose.pt";

    [JsonPropertyName("storeToken")]
    public string StoreToken { get; set; } = "";

    [JsonPropertyName("pollIntervalMs")]
    public int PollIntervalMs { get; set; } = 2000;

    [JsonPropertyName("localPort")]
    public int LocalPort { get; set; } = 4040;
}

public class StoreSyncResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("tenant")]
    public TenantDto? Tenant { get; set; }
}

public class TenantDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
}

public class PendingJobsResponse
{
    [JsonPropertyName("jobs")]
    public List<PrintJobDto> Jobs { get; set; } = new();
}

public class PrintJobDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("orderNumber")]
    public string OrderNumber { get; set; } = "";

    [JsonPropertyName("printerName")]
    public string PrinterName { get; set; } = "";

    [JsonPropertyName("payloadBase64")]
    public string? PayloadBase64 { get; set; }

    [JsonPropertyName("payloadText")]
    public string? PayloadText { get; set; }

    [JsonPropertyName("copies")]
    public int Copies { get; set; } = 1;

    [JsonPropertyName("docName")]
    public string DocName { get; set; } = "Açaí da Rose - Cupom";
}
