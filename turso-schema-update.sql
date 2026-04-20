-- Turso 数据库更新脚本
-- 添加 WritingStyle 表和 AiQuery.writingStyleId 字段

-- 1. 添加 WritingStyle 表
CREATE TABLE IF NOT EXISTS WritingStyle (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    sceneType TEXT NOT NULL,
    titleFormula TEXT NOT NULL,
    contentStructure TEXT NOT NULL,
    toneDescription TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    successCount INTEGER NOT NULL DEFAULT 0,
    failCount INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS WritingStyle_sceneType_idx ON WritingStyle(sceneType);

-- 3. 添加 AiQuery.writingStyleId 字段
ALTER TABLE AiQuery ADD COLUMN writingStyleId TEXT;

-- 4. 插入默认风格数据
INSERT INTO WritingStyle (id, name, sceneType, titleFormula, contentStructure, toneDescription, weight, successCount, failCount)
VALUES 
('ws_price_direct', 'price_direct', 'price_sensitive', 'Save [X]% on [Brand] Rentals with [Code Type]', '["hook_savings","code_list","how_to_use","real_savings_example","faq"]', 'Direct, numbers-focused, no fluff', 1.2, 0, 0),
('ws_price_story', 'price_story', 'price_sensitive', 'How I Saved $[Amount] on [Brand] [Location] Rentals', '["personal_story","problem","solution","step_by_step","final_tip"]', 'Personal, relatable, first-person narrative', 1.5, 0, 0),
('ws_price_compare', 'price_compare', 'price_sensitive', '[Brand] vs [Competitor]: Which [Code Type] Saves More?', '["comparison_hook","side_by_side","winner_declared","how_to_book","pro_tips"]', 'Analytical, objective, data-driven', 1.0, 0, 0),
('ws_location_guide', 'location_guide', 'location_specific', 'The Complete [Location] [Brand] Rental Guide [Year]', '["location_intro","airport_tips","code_application","local_insider","avoid_mistakes"]', 'Authoritative, local expert, insider knowledge', 1.3, 0, 0),
('ws_location_scenario', 'location_scenario', 'location_specific', '[Scenario] at [Location]: Best [Brand] Codes for [Situation]', '["scenario_setup","challenge","solution_codes","step_guide","real_test"]', 'Scenario-based, problem-solution, practical', 1.1, 0, 0),
('ws_audience_exclusive', 'audience_exclusive', 'audience_specific', '[Audience] Exclusive: [Brand] [Benefit] Codes That Actually Work', '["audience_callout","eligibility","exclusive_codes","id_requirements","maximize_savings"]', 'Exclusive, insider, membership-focused', 1.4, 0, 0),
('ws_service_solution', 'service_solution', 'service_need', 'How to Get [Service] with [Brand] Codes (Avoid $[Amount] Fees)', '["fee_warning","code_solution","booking_process","counter_strategy","confirmation"]', 'Problem-aware, solution-focused, warning-then-relief', 1.2, 0, 0),
('ws_urgent_quick', 'urgent_quick', 'urgent', 'Last-Minute [Brand] [Location]: Codes That Work in [Timeframe]', '["urgency_hook","instant_codes","5min_booking","guarantee","backup_plan"]', 'Urgent, fast, immediate action, no fluff', 1.0, 0, 0),
('ws_brand_review', 'brand_review', 'brand_loyal', '[Brand] vs [Competitor] [Year]: Which Corporate Code Wins?', '["comparison_intro","code_battle","price_test","service_compare","verdict"]', 'Comparative, balanced, test-based', 1.1, 0, 0);
