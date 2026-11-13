/**
 * scripts/migrate_option_models_multilingual.js
 * 
 * 1. Adiciona colunas multilíngues em product_option_models:
 *    - name_en, name_es, subtitle_en, subtitle_es
 * 
 * 2. Injeta traduções completas nos 7 modelos e nos itens do JSONB options.
 * 
 * 3. Propaga para option_groups em product_containers de todas as lojas.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: '.env' });
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

const MODELS_DATA = [
  {
    id: 'ddcec6eb-6a9d-4266-93b2-954dfba2e75a',
    name: 'Cremes Gelados Inclusos',
    name_en: 'Included Frozen Creams',
    name_es: 'Cremas Heladas Incluidas',
    subtitle: 'Até 2 opções inclusas',
    subtitle_en: 'Up to 2 included choices',
    subtitle_es: 'Hasta 2 opciones incluidas',
    itemTranslations: {
      '0cb7791d-1293-4a88-a1b6-eddb4e48f257': { nameEn: 'Traditional Açaí', nameEs: 'Açaí Tradicional', descEn: 'Pure and creamy fresh blended açaí', descEs: 'Açaí puro y cremoso batido al momento' },
      'b809f9db-aa42-47ae-8884-e1cd1641e5f8': { nameEn: 'Coconut Cream', nameEs: 'Crema de Coco', descEn: 'Creamy and handcrafted', descEs: 'Cremoso y artesanal' },
      'f5bda89c-fba2-4d31-ab4b-8b4719c8a7ba': { nameEn: 'Cupuaçu Cream', nameEs: 'Crema de Cupuaçu', descEn: 'Authentic Amazonian flavor', descEs: 'Sabor auténtico del Amazonas' },
      '8a64701e-19ea-4199-b55c-222e819f14e2': { nameEn: 'Guava Cream', nameEs: 'Crema de Guayaba', descEn: 'Artisanal and velvety', descEs: 'Artesanal y aterciopelado' },
      'a0863d61-d3e5-431b-b516-01b82d7b5dad': { nameEn: 'Soursop Cream', nameEs: 'Crema de Guanábana', descEn: 'Tropical and refreshing', descEs: 'Tropical y refrescante' },
      'd4862efa-5cb8-4220-83b0-b4b7535f7346': { nameEn: 'Mango Cream', nameEs: 'Crema de Mango', descEn: 'Sweet and smooth', descEs: 'Dulce y suave' },
      '5e07f532-2ee6-49e8-945f-81dfee649213': { nameEn: 'Passion Fruit Cream', nameEs: 'Crema de Maracuyá', descEn: 'Pleasantly tangy', descEs: 'Agradablemente cítrico' },
      'c5e50c74-199f-4438-955c-77ab5cdd62ad': { nameEn: 'Powdered Milk Cream', nameEs: 'Crema de Leche en Polvo', descEn: 'Sweet milky classic', descEs: 'Clásico dulce lechoso' },
      'a2905be0-d00b-44e4-aac6-f3d88f95de25': { nameEn: 'Strawberry Cream', nameEs: 'Crema de Fresa', descEn: 'Fresh and fruity', descEs: 'Fresco y afrutado' },
      '829861a0-8d94-40bc-86f8-7bc2928b75bf': { nameEn: 'Dragon Fruit Cream (Pitaya)', nameEs: 'Crema de Pitaya', descEn: 'Vibrant and delicate', descEs: 'Vibrante y delicado' },
    }
  },
  {
    id: 'b1111111-2222-3333-4444-555555555551',
    name: 'Frutas Frescas Selecionadas',
    name_en: 'Selected Fresh Fruits',
    name_es: 'Frutas Frescas Seleccionadas',
    subtitle: '+0,50 € a partir da 3ª un.',
    subtitle_en: '+€0.50 from 3rd unit',
    subtitle_es: '+0,50 € a partir de la 3ª ud.',
    itemTranslations: {
      'c62f361e-c11b-46e7-8083-3f019bb3e65a': { nameEn: 'Banana', nameEs: 'Plátano' },
      '2f020f4a-45e7-4642-b8ed-0f4e7d400538': { nameEn: 'Kiwi', nameEs: 'Kiwi' },
      'd0e52406-4a08-4ba1-9585-20d8261fd744': { nameEn: 'Mango', nameEs: 'Mango' },
      '213e5ef5-d06d-47c2-a1b0-784dd6f06d51': { nameEn: 'Strawberry', nameEs: 'Fresa' },
      '11d7f689-8b27-46ca-a089-8b9fbbf2c1fb': { nameEn: 'Grape', nameEs: 'Uva' },
    }
  },
  {
    id: 'b2222222-3333-4444-5555-666666666662',
    name: 'Acompanhamentos Tradicionais',
    name_en: 'Traditional Toppings',
    name_es: 'Acompañamientos Tradicionales',
    subtitle: '+0,50 € a partir da 4ª un.',
    subtitle_en: '+€0.50 from 4th unit',
    subtitle_es: '+0,50 € a partir de la 4ª ud.',
    itemTranslations: {
      'f0fc824f-859a-4c37-9252-38d6806fef6d': { nameEn: 'Biscoff Cream', nameEs: 'Crema Biscoff' },
      'e21047bf-cb45-4328-b9cc-64335bd3836e': { nameEn: 'Crushed Biscoff', nameEs: 'Biscoff Triturado' },
      'df1c6cc8-1cf1-4cff-ba79-1b9ef0226b71': { nameEn: 'Crispy Wafer Roll', nameEs: 'Barquillo Crujiente' },
      '0abf815e-aecb-469e-bb76-6d2953169008': { nameEn: 'Chocoball Cereal', nameEs: 'Cereales Chocobol' },
      '0e9d9285-c4e3-4820-81f9-bf416e130db1': { nameEn: 'Granola', nameEs: 'Granola' },
      '2d3a8d51-18f0-4d55-aa53-745030d29da2': { nameEn: 'Natural Yogurt', nameEs: 'Yogur Natural' },
      '6ae69c37-2f6f-4b5b-b407-48ec62055ada': { nameEn: 'Condensed Milk', nameEs: 'Leche Condensada' },
      '8d906565-0121-47d9-b88e-3d836a825289': { nameEn: 'Powdered Milk', nameEs: 'Leche en Polvo' },
      'c5c3c829-08d6-4077-b293-409699fbedda': { nameEn: 'Peanut Butter', nameEs: 'Mantequilla de Cacahuete' },
      'c32f7e12-4c53-47f3-af0c-02f4f66a8210': { nameEn: 'Marshmallow', nameEs: 'Malvaviscos' },
      '308921c1-cb49-4214-a70d-9555377bcad2': { nameEn: 'Pure Honey', nameEs: 'Miel Pura' },
      'f8347460-d172-41eb-b481-c0a23c9a02a1': { nameEn: 'Whole Oreo', nameEs: 'Oreo Entera' },
      'aa18c238-2d40-47da-a9b6-0b9d1d21c50b': { nameEn: 'Crushed Oreo', nameEs: 'Oreo Triturada' },
      '131fe9e3-54d2-441e-b95e-0c9bb2e7a73d': { nameEn: 'Ovomaltine Crunchy', nameEs: 'Ovomaltine Crujiente' },
      '2d7bc502-e04c-4d21-b255-2d3b954dc411': { nameEn: 'Paçoca (Peanut Candy)', nameEs: 'Paçoca (Dulce de Cacahuete)' },
      '40761685-0f9e-4a62-bde1-6c885bebbea7': { nameEn: 'Chocolate Chips', nameEs: 'Pepitas de Chocolate' },
      'a0198535-e6d0-4298-9748-c507ac3e46f3': { nameEn: 'Candy Sprinkles (Pintarolas)', nameEs: 'Grageas de Chocolate (Pintarolas)' },
    }
  },
  {
    id: 'b3333333-4444-5555-6666-777777777773',
    name: 'Caldas Nobres & Especiais',
    name_en: 'Noble & Special Syrups',
    name_es: 'Salsas Nobles & Especiales',
    subtitle: 'Adicionais gourmet',
    subtitle_en: 'Gourmet add-ons',
    subtitle_es: 'Adicionales gourmet',
    itemTranslations: {
      'b6da5606-b64f-453a-be89-6e230ee9bd15': { nameEn: 'Pistachio Cream', nameEs: 'Crema de Pistacho' },
      '20a054fa-4b6f-4af3-a75f-be000806e16e': { nameEn: 'Nutella', nameEs: 'Nutella' },
      'e0ded3da-a363-488b-87eb-2c1896cda41f': { nameEn: 'Powdered Milk Cream', nameEs: 'Crema de Leche en Polvo' },
    }
  },
  {
    id: 'c7777777-1111-2222-3333-444444444444',
    name: 'Quer talher extra?',
    name_en: 'Want extra cutlery?',
    name_es: '¿Desea cubiertos extra?',
    subtitle: '+0,10 € cada un. extra',
    subtitle_en: '+€0.10 each extra unit',
    subtitle_es: '+0,10 € cada ud. extra',
    itemTranslations: {
      'opt-talher-colher': { 
        nameEn: 'Extra disposable spoon', 
        nameEs: 'Cuchara desechable extra',
        descEn: 'Additional disposable spoon for consumption',
        descEs: 'Cuchara desechable adicional para consumo'
      }
    }
  },
  {
    id: '11185376-0d2e-4c4b-ac9c-f09509576a53',
    name: 'Escolha a Fruta',
    name_en: 'Choose the Fruit',
    name_es: 'Elige la Fruta',
    subtitle: 'Escolha 1 opção',
    subtitle_en: 'Choose 1 option',
    subtitle_es: 'Elige 1 opción',
    itemTranslations: {
      'opt-1793283676310-1': { nameEn: 'Banana', nameEs: 'Plátano' },
      'opt-1793283681862-1': { nameEn: 'Strawberry', nameEs: 'Fresa' },
    }
  },
  {
    id: 'a75eeb77-09bb-4923-a04c-8aeefcc74dfa',
    name: 'Escolha os sabores do seu copo',
    name_en: 'Choose your cup flavors',
    name_es: 'Elige los sabores de tu vaso',
    subtitle: 'Seleção de adicionais',
    subtitle_en: 'Add-on selection',
    subtitle_es: 'Selección de adicionales',
    itemTranslations: {
      'opt-1793215305807': { nameEn: 'Extra toppings', nameEs: 'Toppings extras' },
      'opt-1793215443866-1': { nameEn: 'Extra cream', nameEs: 'Crema extra' },
    }
  }
];

async function migrate() {
  const client = await pool.connect();
  console.log('🚀 Iniciando migração multilíngue de product_option_models...');

  try {
    await client.query('BEGIN');

    // 1. Criar colunas se não existirem
    console.log('📦 [1/4] Adicionando colunas multilíngues em product_option_models...');
    await client.query(`
      ALTER TABLE product_option_models ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
      ALTER TABLE product_option_models ADD COLUMN IF NOT EXISTS name_es VARCHAR(255);
      ALTER TABLE product_option_models ADD COLUMN IF NOT EXISTS subtitle_en TEXT;
      ALTER TABLE product_option_models ADD COLUMN IF NOT EXISTS subtitle_es TEXT;
    `);

    // 2. Atualizar cada modelo com nomes, subtítulos e options com nameEn/nameEs
    console.log('🌐 [2/4] Atualizando dados dos 7 modelos e seus itens JSONB...');
    for (const m of MODELS_DATA) {
      // Buscar opções atuais do modelo
      const currentRes = await client.query(
        'SELECT options, subtitle FROM product_option_models WHERE id::text = $1',
        [m.id]
      );
      if (currentRes.rows.length === 0) continue;

      const currentOptions = currentRes.rows[0].options || [];
      const updatedOptions = currentOptions.map(opt => {
        const trans = m.itemTranslations[opt.id] || {};
        return {
          ...opt,
          nameEn: trans.nameEn || opt.nameEn || opt.name,
          nameEs: trans.nameEs || opt.nameEs || opt.name,
          descriptionEn: trans.descEn || opt.descriptionEn || opt.description || '',
          descriptionEs: trans.descEs || opt.descriptionEs || opt.description || '',
        };
      });

      const effectiveSubtitle = currentRes.rows[0].subtitle || m.subtitle;

      await client.query(`
        UPDATE product_option_models
        SET name_en = $2,
            name_es = $3,
            subtitle = COALESCE(subtitle, $4),
            subtitle_en = $5,
            subtitle_es = $6,
            options = $7::jsonb,
            updated_at = timezone('utc'::text, now())
        WHERE id::text = $1
      `, [
        m.id,
        m.name_en,
        m.name_es,
        effectiveSubtitle,
        m.subtitle_en,
        m.subtitle_es,
        JSON.stringify(updatedOptions),
      ]);
      console.log(`   ✓ Modelo "${m.name}" atualizado com sucesso.`);
    }

    // 3. Sincronizar option_groups embutidos em product_containers
    console.log('🔄 [3/4] Sincronizando option_groups embutidos em product_containers...');
    const containersRes = await client.query(`
      SELECT id, option_groups FROM product_containers 
      WHERE option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0
    `);

    // Criar mapa de modelos atualizados
    const modelsRes = await client.query('SELECT * FROM product_option_models');
    const modelsMap = new Map();
    for (const row of modelsRes.rows) {
      modelsMap.set(row.id, row);
    }

    let updatedContainersCount = 0;
    for (const row of containersRes.rows) {
      const groups = Array.isArray(row.option_groups) ? row.option_groups : [];
      let changed = false;

      const newGroups = groups.map(g => {
        const model = modelsMap.get(g.id);
        if (model) {
          changed = true;
          return {
            ...g,
            name: model.name || g.name,
            nameEn: model.name_en || g.nameEn,
            nameEs: model.name_es || g.nameEs,
            subtitle: model.subtitle || g.subtitle,
            subtitleEn: model.subtitle_en || g.subtitleEn,
            subtitleEs: model.subtitle_es || g.subtitleEs,
            options: Array.isArray(model.options) && model.options.length > 0 ? model.options : g.options,
          };
        }
        return g;
      });

      if (changed) {
        await client.query(
          'UPDATE product_containers SET option_groups = $1::jsonb WHERE id = $2',
          [JSON.stringify(newGroups), row.id]
        );
        updatedContainersCount++;
      }
    }
    console.log(`   ✓ ${updatedContainersCount} recipientes sincronizados.`);

    // 4. Incrementar versão do catálogo nas 3 lojas para forçar refresh nos navegadores
    console.log('🚀 [4/4] Incrementando store_catalog_versions...');
    await client.query(`
      UPDATE store_catalog_versions 
      SET version = version + 1, updated_at = timezone('utc'::text, now())
    `);

    await client.query('COMMIT');
    console.log('🎉 Migração concluída com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

