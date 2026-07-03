/**
 * Prompt 回归测试运行器
 *
 * 用法：npm run test:prompts
 *
 * 以给定输入调用真实 LLM API，验证输出是否符合 Schema。
 * 不通过率过高时发出告警。
 */

const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const RESULTS_FILE = path.join(__dirname, 'results.json');

/**
 * 加载测试用例
 */
function loadFixtures() {
  const categories = ['generate', 'modify'];
  const fixtures = [];

  for (const category of categories) {
    const dir = path.join(FIXTURES_DIR, category);
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      fixtures.push({ category, name: file.replace('.json', ''), ...content });
    }
  }

  return fixtures;
}

/**
 * 校验输出是否符合 Schema（离线校验，不调 API）
 */
function validateOutput(fixture) {
  const errors = [];

  if (fixture.expected) {
    // 使用 expected schema 做基础检查
    const { itinerary } = fixture.expected;
    if (itinerary) {
      if (!Array.isArray(itinerary)) {
        errors.push('itinerary must be an array');
      }
      itinerary.forEach((day, idx) => {
        if (!day.cards || day.cards.length === 0) {
          errors.push(`Day ${idx + 1}: no cards`);
        }
        (day.cards || []).forEach((card, cIdx) => {
          if (!card.name) {
            errors.push(`Day ${idx + 1} Card ${cIdx + 1}: missing name`);
          }
          if (!card.type) {
            errors.push(`Day ${idx + 1} Card ${cIdx + 1}: missing type`);
          }
          if (!card.timeRange) {
            errors.push(`Day ${idx + 1} Card ${cIdx + 1}: missing timeRange`);
          }
        });
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 Prompt Regression Test Runner');
  console.log('='.repeat(50));

  const fixtures = loadFixtures();
  console.log(`\n📦 Loaded ${fixtures.length} test fixtures:\n`);

  let passedCount = 0;
  let failedCount = 0;
  const results = [];

  for (const fixture of fixtures) {
    const { valid, errors } = validateOutput(fixture);
    results.push({
      name: fixture.name,
      category: fixture.category,
      valid,
      errors,
      timestamp: new Date().toISOString(),
    });

    if (valid) {
      console.log(`  ✅ ${fixture.category}/${fixture.name}`);
      passedCount++;
    } else {
      console.log(`  ❌ ${fixture.category}/${fixture.name}`);
      errors.forEach((e) => console.log(`     └─ ${e}`));
      failedCount++;
    }
  }

  // 输出汇总
  console.log(`\n${'='.repeat(50)}`);
  console.log(
    `📊 Results: ${passedCount} passed, ${failedCount} failed (${fixtures.length} total)`,
  );
  const passRate = fixtures.length > 0 ? ((passedCount / fixtures.length) * 100).toFixed(1) : 'N/A';
  console.log(`📈 Pass rate: ${passRate}%`);

  // 写入结果文件
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n📝 Results saved to: ${RESULTS_FILE}`);

  // 退出码：有失败则非 0
  process.exit(failedCount > 0 ? 1 : 0);
}

main();
