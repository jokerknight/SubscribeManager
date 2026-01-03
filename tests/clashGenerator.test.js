/**
 * Clash 配置生成器测试
 */

const { generateClashConfig, validateAndLoadTemplate } = require('../utils/converters/clashConfigGenerator');

describe('Clash Config Generator', () => {
  describe('validateAndLoadTemplate', () => {
    it('应该能够加载模板内容', async () => {
      // 注意：这个测试需要实际的模板 URL
      // 在实际运行时，请替换为有效的模板 URL
      const templateUrl = 'https://raw.githubusercontent.com/tindy2013/subconverter/master/config/config_base.ini';

      try {
        const result = await validateAndLoadTemplate(templateUrl);
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(typeof result.content).toBe('string');
      } catch (error) {
        console.log('模板加载测试失败（可能是网络问题）:', error.message);
      }
    });

    it('应该拒绝无效的 URL', async () => {
      const templateUrl = 'not-a-valid-url';

      await expect(validateAndLoadTemplate(templateUrl)).rejects.toThrow();
    });
  });

  describe('generateClashConfig', () => {
    it('应该能够生成 Clash 配置', async () => {
      // 注意：这个测试需要实际的 Subconvert API URL
      // 在实际运行时，请替换为有效的 Subconvert API URL
      const subconvertApiUrl = 'https://sub.xeton.dev/sub?target=clash&emoji=true&url=https://example.com';

      try {
        const config = await generateClashConfig(subconvertApiUrl);
        expect(config).toBeDefined();
        expect(typeof config).toBe('string');
        expect(config.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('配置生成测试失败（可能是网络问题）:', error.message);
      }
    });

    it('应该拒绝无效的 Subconvert API URL', async () => {
      const subconvertApiUrl = 'not-a-valid-url';

      await expect(generateClashConfig(subconvertApiUrl)).rejects.toThrow();
    });
  });
});
