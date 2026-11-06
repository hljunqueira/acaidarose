using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Printing;
using System.IO;
using System.Text;
using System.Windows.Forms;

namespace AcaiDaRose.PrintAgent;

public class MainForm : Form
{
    private readonly AgentConfig _config;
    private readonly Action<AgentConfig> _onConfigSaved;
    private readonly Func<string, (bool success, string? storeName)> _onSyncStore;
    private readonly Action<string> _onTestPrint;
    private readonly Action _onOpenLogs;
    private readonly Action<string, string, Color?, string?, object?> _onLogRecorded;
    private readonly bool _startMinimized;

    private Panel _headerPanel = null!;
    private Panel _mainContainer = null!;
    private PictureBox _logoBox = null!;
    private Label _statusBadge = null!;

    // Card de Controle Compacto (Grid 4 Colunas)
    private Panel _gridCard = null!;
    private Label _col1Header = null!;
    private TextBox _tokenInput = null!;
    private Label _col1Desc = null!;

    private Label _col2Header = null!;
    private Button _saveBtn = null!;
    private Label _storeNameLabel = null!;

    private Label _col3Header = null!;
    private ComboBox _printersCombo = null!;
    private Button _reloadPrintersBtn = null!;

    private Label _col4Header = null!;
    private Button _testBtn = null!;
    private Label _col4Desc = null!;

    // Card Inferior de Logs
    private Panel _logCard = null!;
    private RichTextBox _logBox = null!;
    private Button _clearLogBtn = null!;
    private Button _openLogsBtn = null!;

    private NotifyIcon _trayIcon = null!;
    private ContextMenuStrip _trayMenu = null!;

    // Paleta oficial Açaí da Rose
    private static readonly Color ColorBg = Color.FromArgb(18, 2, 36);            // #120224
    private static readonly Color ColorCard = Color.FromArgb(28, 8, 52);          // #1c0834
    private static readonly Color ColorCardBorder = Color.FromArgb(68, 25, 115);   // #441973
    private static readonly Color ColorInputBg = Color.FromArgb(14, 2, 28);       // #0e021c
    private static readonly Color ColorPrimary = Color.FromArgb(124, 58, 237);    // #7c3aed
    private static readonly Color ColorPrimaryHover = Color.FromArgb(109, 40, 217);
    private static readonly Color ColorSecondary = Color.FromArgb(76, 29, 149);   // #4c1d95
    private static readonly Color ColorEmerald = Color.FromArgb(16, 185, 129);    // #10b981
    private static readonly Color ColorLavender = Color.FromArgb(216, 180, 254);
    private static readonly Color ColorTextMuted = Color.FromArgb(168, 130, 210);

    public MainForm(
        AgentConfig config,
        Action<AgentConfig> onConfigSaved,
        Func<string, (bool success, string? storeName)> onSyncStore,
        Action<string> onTestPrint,
        Action onOpenLogs,
        Action<string, string, Color?, string?, object?> onLogRecorded,
        bool startMinimized = false)
    {
        _config = config;
        _onConfigSaved = onConfigSaved;
        _onSyncStore = onSyncStore;
        _onTestPrint = onTestPrint;
        _onOpenLogs = onOpenLogs;
        _onLogRecorded = onLogRecorded;
        _startMinimized = startMinimized;

        InitializeComponent();
        LoadPrinters();
        ApplyInitialConfig();
    }

    private void InitializeComponent()
    {
        Text = "Açaí da Rose — Servidor de Impressão Windows v1.0";
        BackColor = ColorBg;
        ForeColor = Color.White;
        Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
        Size = new Size(960, 600);
        MinimumSize = new Size(880, 480);
        StartPosition = FormStartPosition.CenterScreen;
        DoubleBuffered = true;

        if (_startMinimized)
        {
            WindowState = FormWindowState.Minimized;
            ShowInTaskbar = false;
        }

        Shown += (s, e) =>
        {
            if (_startMinimized)
            {
                Hide();
            }
        };

        // Ícone da Aplicação
        string icoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.ico");
        if (File.Exists(icoPath))
        {
            try { Icon = new Icon(icoPath); } catch { }
        }

        // Bandeja do Sistema (System Tray)
        _trayMenu = new ContextMenuStrip();
        _trayMenu.Items.Add("Abrir Servidor", null, (s, e) => RestoreFromTray());
        _trayMenu.Items.Add("Abrir Pasta de Logs", null, (s, e) => _onOpenLogs());
        _trayMenu.Items.Add(new ToolStripSeparator());
        _trayMenu.Items.Add("Sair Definitivamente", null, (s, e) => ExitApplication());

        _trayIcon = new NotifyIcon
        {
            Text = "Açaí da Rose — Servidor de Impressão",
            Icon = Icon ?? SystemIcons.Application,
            ContextMenuStrip = _trayMenu,
            Visible = true
        };
        _trayIcon.DoubleClick += (s, e) => RestoreFromTray();

        // 1. Cabeçalho Superior Fixo (Compacto 72px)
        _headerPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 74,
            BackColor = ColorCard,
            Padding = new Padding(16, 8, 16, 8)
        };
        _headerPanel.Paint += (s, e) =>
        {
            using var pen = new Pen(ColorCardBorder, 1);
            e.Graphics.DrawLine(pen, 0, _headerPanel.Height - 1, _headerPanel.Width, _headerPanel.Height - 1);
        };

        _logoBox = new PictureBox
        {
            Size = new Size(110, 52),
            Location = new Point(16, 11),
            SizeMode = PictureBoxSizeMode.Zoom,
            BackColor = Color.Transparent
        };
        string logoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logo.png");
        if (File.Exists(logoPath))
        {
            try { _logoBox.Image = Image.FromFile(logoPath); } catch { }
        }
        _headerPanel.Controls.Add(_logoBox);

        var titleLabel = new Label
        {
            Text = "AÇAÍ DA ROSE — SERVIDOR DE IMPRESSÃO WINDOWS",
            Font = new Font("Segoe UI", 11.5f, FontStyle.Bold),
            ForeColor = Color.White,
            Location = new Point(138, 14),
            AutoSize = true
        };
        _headerPanel.Controls.Add(titleLabel);

        var subtitleLabel = new Label
        {
            Text = "Conexão direta ao Spooler local (ESC/POS) · Sem popups · URL e conexão automáticas",
            Font = new Font("Segoe UI", 8.5f),
            ForeColor = ColorLavender,
            Location = new Point(138, 38),
            AutoSize = true
        };
        _headerPanel.Controls.Add(subtitleLabel);

        _statusBadge = new Label
        {
            Text = "● Online (Porta 4040)",
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            ForeColor = ColorEmerald,
            BackColor = Color.FromArgb(12, 48, 28),
            TextAlign = ContentAlignment.MiddleCenter,
            Size = new Size(170, 32),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            Location = new Point(_headerPanel.ClientSize.Width - 186, 21)
        };
        _statusBadge.Paint += (s, e) =>
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using var pen = new Pen(Color.FromArgb(16, 185, 129), 1);
            using var path = CreateRoundedRectangle(new Rectangle(0, 0, _statusBadge.Width - 1, _statusBadge.Height - 1), 6);
            e.Graphics.DrawPath(pen, path);
        };
        _headerPanel.Controls.Add(_statusBadge);

        // 2. Container Central
        _mainContainer = new Panel
        {
            Dock = DockStyle.Fill,
            AutoScroll = false,
            BackColor = ColorBg
        };

        // Ordem estrita de acoplamento: container primeiro, depois header com SendToBack()
        Controls.Add(_mainContainer);
        Controls.Add(_headerPanel);
        _headerPanel.SendToBack();

        // 3. Card Compacto em Grid de 4 Colunas
        _gridCard = CreateCardPanel();
        _mainContainer.Controls.Add(_gridCard);

        // Coluna 1: Token
        _col1Header = new Label
        {
            Text = "1. TOKEN DA UNIDADE",
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            ForeColor = ColorLavender,
            AutoSize = true
        };
        _gridCard.Controls.Add(_col1Header);

        _tokenInput = new TextBox
        {
            BackColor = ColorInputBg,
            ForeColor = Color.White,
            BorderStyle = BorderStyle.FixedSingle,
            Font = new Font("Consolas", 10f),
            Text = _config.StoreToken
        };
        _gridCard.Controls.Add(_tokenInput);

        _col1Desc = new Label
        {
            Text = "Chave copiada no Admin",
            Font = new Font("Segoe UI", 7.5f),
            ForeColor = ColorTextMuted,
            AutoSize = true
        };
        _gridCard.Controls.Add(_col1Desc);

        // Coluna 2: Conexão
        _col2Header = new Label
        {
            Text = "2. STATUS / CONEXÃO",
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            ForeColor = ColorLavender,
            AutoSize = true
        };
        _gridCard.Controls.Add(_col2Header);

        _saveBtn = new Button
        {
            Text = "Conectar Loja",
            Height = 30,
            BackColor = ColorPrimary,
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 9f, FontStyle.Bold),
            Cursor = Cursors.Hand
        };
        _saveBtn.FlatAppearance.BorderSize = 0;
        _saveBtn.Click += (s, e) => SaveStoreConfiguration();
        _gridCard.Controls.Add(_saveBtn);

        _storeNameLabel = new Label
        {
            Text = "Aguardando conexão...",
            Font = new Font("Segoe UI", 8f, FontStyle.Bold),
            ForeColor = ColorLavender,
            AutoEllipsis = true
        };
        _gridCard.Controls.Add(_storeNameLabel);

        // Coluna 3: Impressora
        _col3Header = new Label
        {
            Text = "3. IMPRESSORA TÉRMICA",
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            ForeColor = ColorLavender,
            AutoSize = true
        };
        _gridCard.Controls.Add(_col3Header);

        _printersCombo = new ComboBox
        {
            DropDownStyle = ComboBoxStyle.DropDownList,
            BackColor = ColorInputBg,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 9.5f)
        };
        _gridCard.Controls.Add(_printersCombo);

        _reloadPrintersBtn = new Button
        {
            Text = "↻ Atualizar impressoras",
            Height = 22,
            BackColor = Color.Transparent,
            ForeColor = Color.FromArgb(192, 132, 252),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 8f),
            Cursor = Cursors.Hand,
            TextAlign = ContentAlignment.MiddleLeft
        };
        _reloadPrintersBtn.FlatAppearance.BorderSize = 0;
        _reloadPrintersBtn.Click += (s, e) => LoadPrinters();
        _gridCard.Controls.Add(_reloadPrintersBtn);

        // Coluna 4: Teste
        _col4Header = new Label
        {
            Text = "4. TESTE DE IMPRESSÃO",
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            ForeColor = ColorLavender,
            AutoSize = true
        };
        _gridCard.Controls.Add(_col4Header);

        _testBtn = new Button
        {
            Text = "Testar Impressão",
            Height = 30,
            BackColor = ColorSecondary,
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 9f, FontStyle.Bold),
            Cursor = Cursors.Hand
        };
        _testBtn.FlatAppearance.BorderSize = 0;
        _testBtn.Click += (s, e) => ExecuteTestPrint();
        _gridCard.Controls.Add(_testBtn);

        _col4Desc = new Label
        {
            Text = "Dispara cupom ESC/POS",
            Font = new Font("Segoe UI", 7.5f),
            ForeColor = ColorTextMuted,
            AutoSize = true
        };
        _gridCard.Controls.Add(_col4Desc);

        // 4. Card Inferior: Registro de Impressões em Tempo Real
        _logCard = CreateCardPanel();
        _mainContainer.Controls.Add(_logCard);

        var logHeader = new Label
        {
            Text = "REGISTRO DE IMPRESSÕES EM TEMPO REAL",
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            ForeColor = ColorLavender,
            Location = new Point(14, 11),
            AutoSize = true
        };
        _logCard.Controls.Add(logHeader);

        _clearLogBtn = new Button
        {
            Text = "Limpar Log",
            Size = new Size(85, 22),
            BackColor = Color.Transparent,
            ForeColor = ColorTextMuted,
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 7.5f),
            Cursor = Cursors.Hand
        };
        _clearLogBtn.FlatAppearance.BorderSize = 0;
        _clearLogBtn.Click += (s, e) => _logBox.Clear();
        _logCard.Controls.Add(_clearLogBtn);

        _openLogsBtn = new Button
        {
            Text = "📁 Abrir Pasta de Logs",
            Size = new Size(150, 22),
            BackColor = Color.Transparent,
            ForeColor = Color.FromArgb(192, 132, 252),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 7.5f),
            Cursor = Cursors.Hand
        };
        _openLogsBtn.FlatAppearance.BorderSize = 0;
        _openLogsBtn.Click += (s, e) => _onOpenLogs();
        _logCard.Controls.Add(_openLogsBtn);

        _logBox = new RichTextBox
        {
            BackColor = Color.FromArgb(10, 1, 22),
            ForeColor = Color.FromArgb(226, 232, 240),
            Font = new Font("Consolas", 9f),
            ReadOnly = true,
            BorderStyle = BorderStyle.None
        };
        _logCard.Controls.Add(_logBox);

        // Layout responsivo
        LayoutControls();
        _mainContainer.Resize += (s, e) => LayoutControls();

        // Minimizar na bandeja
        FormClosing += (s, e) =>
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                Hide();
                _trayIcon.ShowBalloonTip(2000, "Açaí da Rose", "O Servidor de Impressão continua operando em segundo plano.", ToolTipIcon.Info);
            }
        };

        AppendLog("Servidor de Impressão local iniciado com sucesso na porta 4040.", ColorEmerald);
    }

    private void LayoutControls()
    {
        if (_mainContainer == null || _gridCard == null || _logCard == null)
            return;

        int margin = 14;
        int cardWidth = Math.Max(780, _mainContainer.ClientSize.Width - (margin * 2));

        // 1. Grid Card Superior de 4 Colunas (Compacto 112px)
        int gridH = 112;
        _gridCard.Location = new Point(margin, 12);
        _gridCard.Size = new Size(cardWidth, gridH);

        int pad = 14;
        int spacing = 14;
        int availW = cardWidth - (pad * 2);
        int colW = Math.Max(160, (availW - (3 * spacing)) / 4);

        int col1X = pad;
        int col2X = col1X + colW + spacing;
        int col3X = col2X + colW + spacing;
        int col4X = col3X + colW + spacing;

        // Coluna 1: Token
        _col1Header.Location = new Point(col1X, 12);
        _tokenInput.Location = new Point(col1X, 36);
        _tokenInput.Width = colW;
        _col1Desc.Location = new Point(col1X, 68);
        _col1Desc.Width = colW;

        // Coluna 2: Conexão
        _col2Header.Location = new Point(col2X, 12);
        _saveBtn.Location = new Point(col2X, 35);
        _saveBtn.Width = colW;
        _storeNameLabel.Location = new Point(col2X, 70);
        _storeNameLabel.Width = colW;

        // Coluna 3: Impressora
        _col3Header.Location = new Point(col3X, 12);
        _printersCombo.Location = new Point(col3X, 36);
        _printersCombo.Width = colW;
        _reloadPrintersBtn.Location = new Point(col3X - 4, 66);
        _reloadPrintersBtn.Width = colW + 8;

        // Coluna 4: Teste
        _col4Header.Location = new Point(col4X, 12);
        _testBtn.Location = new Point(col4X, 35);
        _testBtn.Width = colW;
        _col4Desc.Location = new Point(col4X, 70);
        _col4Desc.Width = colW;

        // 2. Card Inferior (Terminal de Logs) - Ocupa todo o restante da altura
        int logY = 12 + gridH + 12;
        int remainingH = _mainContainer.ClientSize.Height - logY - 12;
        int logHeight = Math.Max(180, remainingH);

        _logCard.Location = new Point(margin, logY);
        _logCard.Size = new Size(cardWidth, logHeight);
        _clearLogBtn.Location = new Point(cardWidth - 95, 10);
        if (_openLogsBtn != null)
        {
            _openLogsBtn.Location = new Point(cardWidth - 255, 10);
        }
        _logBox.Location = new Point(14, 36);
        _logBox.Size = new Size(cardWidth - 28, logHeight - 48);

        // Header status badge
        if (_statusBadge != null && _headerPanel != null)
        {
            _statusBadge.Location = new Point(_headerPanel.ClientSize.Width - 186, 21);
        }
    }

    private Panel CreateCardPanel()
    {
        var panel = new Panel
        {
            BackColor = ColorCard
        };
        panel.Paint += (s, e) =>
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            var rect = new Rectangle(0, 0, panel.Width - 1, panel.Height - 1);
            using var path = CreateRoundedRectangle(rect, 8);
            using var pen = new Pen(ColorCardBorder, 1);
            e.Graphics.DrawPath(pen, path);
        };
        return panel;
    }

    private static GraphicsPath CreateRoundedRectangle(Rectangle rect, int radius)
    {
        var path = new GraphicsPath();
        int diameter = radius * 2;
        var arc = new Rectangle(rect.Location, new Size(diameter, diameter));

        path.AddArc(arc, 180, 90);
        arc.X = rect.Right - diameter;
        path.AddArc(arc, 270, 90);
        arc.Y = rect.Bottom - diameter;
        path.AddArc(arc, 0, 90);
        arc.X = rect.Left;
        path.AddArc(arc, 90, 90);
        path.CloseFigure();
        return path;
    }

    public void AppendLog(string message, Color? color = null)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => AppendLog(message, color)));
            return;
        }

        string timestamp = DateTime.Now.ToString("HH:mm:ss");
        _logBox.SelectionStart = _logBox.TextLength;
        _logBox.SelectionLength = 0;
        _logBox.SelectionColor = ColorTextMuted;
        _logBox.AppendText($"[{timestamp}] ");

        _logBox.SelectionColor = color ?? Color.White;
        _logBox.AppendText($"{message}\n");
        _logBox.ScrollToCaret();
    }

    public void UpdateStoreStatus(string storeName)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => UpdateStoreStatus(storeName)));
            return;
        }
        _storeNameLabel.Text = $"✓ {storeName}";
        _storeNameLabel.ForeColor = ColorEmerald;
    }

    private void LoadPrinters()
    {
        _printersCombo.Items.Clear();
        foreach (string printer in PrinterSettings.InstalledPrinters)
        {
            _printersCombo.Items.Add(printer);
        }

        if (_printersCombo.Items.Count > 0)
        {
            int selectedIdx = 0;
            for (int i = 0; i < _printersCombo.Items.Count; i++)
            {
                string name = _printersCombo.Items[i]?.ToString() ?? "";
                if (System.Text.RegularExpressions.Regex.IsMatch(name, @"mp|th|pos|epson|bema|daruma|tm|thermal", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                {
                    selectedIdx = i;
                    break;
                }
            }
            _printersCombo.SelectedIndex = selectedIdx;
        }
    }

    private void ApplyInitialConfig()
    {
        if (!string.IsNullOrWhiteSpace(_config.StoreToken))
        {
            var res = _onSyncStore(_config.StoreToken);
            if (res.success && res.storeName != null)
            {
                UpdateStoreStatus(res.storeName);
            }
        }
    }

    private void SaveStoreConfiguration()
    {
        string token = _tokenInput.Text.Trim();

        if (string.IsNullOrEmpty(token))
        {
            MessageBox.Show("Por favor, cole o Token de Integração da sua loja.", "Açaí da Rose", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        _config.StoreToken = token;
        _onConfigSaved(_config);

        _onLogRecorded($"Tentando conectar à loja com token '{token}'...", "INFO", ColorLavender, "PRINT_AGENT_CONNECTING", new { token });
        var res = _onSyncStore(token);
        if (res.success && res.storeName != null)
        {
            UpdateStoreStatus(res.storeName);
            _onLogRecorded($"Vinculado com sucesso à: {res.storeName} ({_config.ApiUrl})", "INFO", ColorEmerald, "PRINT_AGENT_CONNECTED", new { store = res.storeName, url = _config.ApiUrl });
            MessageBox.Show($"Servidor de Impressão vinculado com sucesso à:\n{res.storeName}", "Açaí da Rose", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        else
        {
            _onLogRecorded($"Aviso: Não foi possível validar o token da loja com o servidor central.", "WARN", Color.FromArgb(245, 158, 11), "PRINT_AGENT_AUTH_FAILED", new { token });
            MessageBox.Show("Não foi possível validar o token da loja com o servidor central. Verifique o token e tente novamente.", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    private void ExecuteTestPrint()
    {
        if (_printersCombo.SelectedItem == null)
        {
            MessageBox.Show("Nenhuma impressora selecionada para teste.", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        string printer = _printersCombo.SelectedItem.ToString()!;
        _onLogRecorded($"Disparando teste de impressão para '{printer}'...", "INFO", ColorLavender, "PRINT_AGENT_TEST", new { printer });
        _onTestPrint(printer);
    }

    private void RestoreFromTray()
    {
        Show();
        ShowInTaskbar = true;
        WindowState = FormWindowState.Normal;
        BringToFront();
    }

    private void ExitApplication()
    {
        _trayIcon.Visible = false;
        Application.Exit();
    }
}
