const { 
  extractNodeName, 
  isValidNodeLink, 
  parseNodeContent,
  NODE_TYPES 
} = require('../utils');

describe('Node Validators', () => {
  describe('extractNodeName', () => {
    it('should extract name from vmess link', () => {
      const vmessLink = 'vmess://eyJ2IjoiV...', 'name': 'TestVMess'}';
      const result = extractNodeName(vmessLink);
      expect(result).toBe('TestVMess');
    });

    it('should return default name for vmess without ps field', () => {
      const vmessLink = 'vmess://eyJ2IjoiV...';
      const result = extractNodeName(vmessLink);
      expect(result).toBe('未命名节点');
    });

    it('should extract name from snell link', () => {
      const snellLink = 'MySnellNode=snell,server.example.com,10000,chacha20-ietf-poly1305,password';
      const result = extractNodeName(snellLink);
      expect(result).toBe('MySnellNode');
    });

    it('should return default name for snell without name', () => {
      const snellLink = '=snell,server.example.com,10000,chacha20-ietf-poly1305,password';
      const result = extractNodeName(snellLink);
      expect(result).toBe('未命名节点');
    });

    it('should extract name from hash fragment', () => {
      const link = 'ss://server:port#MyTestNode';
      const result = extractNodeName(link);
      expect(result).toBe('MyTestNode');
    });

    it('should handle URL encoded names', () => {
      const link = 'ss://server:port#Test%20Node%20%26%20Special';
      const result = extractNodeName(link);
      expect(result).toBe('Test Node & Special');
    });

    it('should return default name for invalid URL encoding', () => {
      const link = 'ss://server:port#Test%ZZInvalid';
      const result = extractNodeName(link);
      expect(result).toBe('Test%ZZInvalid');
    });

    it('should return default name for empty input', () => {
      const result = extractNodeName('');
      expect(result).toBe('未命名节点');
    });

    it('should return default name for null/undefined input', () => {
      expect(extractNodeName(null)).toBe('未命名节点');
      expect(extractNodeName(undefined)).toBe('未命名节点');
    });

    it('should handle links without hash', () => {
      const link = 'ss://server:port';
      const result = extractNodeName(link);
      expect(result).toBe('未命名节点');
    });
  });

  describe('isValidNodeLink', () => {
    it('should validate vmess links', () => {
      expect(isValidNodeLink('vmess://eyJ2IjoiV...')).toBe(true);
      expect(isValidNodeLink('VMESS://eyJ2IjoiV...')).toBe(true);
    });

    it('should validate shadowsocks links', () => {
      expect(isValidNodeLink('ss://YWRtaW4')).toBe(true);
      expect(isValidNodeLink('SS://YWRtaW4')).toBe(true);
    });

    it('should validate vless links', () => {
      expect(isValidNodeLink('vless://uuid@server:port')).toBe(true);
      expect(isValidNodeLink('VLESS://uuid@server:port')).toBe(true);
    });

    it('should validate trojan links', () => {
      expect(isValidNodeLink('trojan://password@server:port')).toBe(true);
      expect(isValidNodeLink('TROJAN://password@server:port')).toBe(true);
    });

    it('should validate hysteria2 links', () => {
      expect(isValidNodeLink('hysteria2://auth@server:port')).toBe(true);
      expect(isValidNodeLink('HYSTERIA2://auth@server:port')).toBe(true);
    });

    it('should validate tuic links', () => {
      expect(isValidNodeLink('tuic://uuid:password@server:port')).toBe(true);
      expect(isValidNodeLink('TUIC://uuid:password@server:port')).toBe(true);
    });

    it('should validate snell links', () => {
      expect(isValidNodeLink('TestNode=snell,server,10000,cipher,password')).toBe(true);
    });

    it('should reject invalid links', () => {
      expect(isValidNodeLink('invalid://link')).toBe(false);
      expect(isValidNodeLink('not-a-link')).toBe(false);
      expect(isValidNodeLink('')).toBe(false);
      expect(isValidNodeLink(null)).toBe(false);
      expect(isValidNodeLink(undefined)).toBe(false);
      expect(isValidNodeLink(123)).toBe(false);
      expect(isValidNodeLink({})).toBe(false);
    });

    it('should reject links with spaces only', () => {
      expect(isValidNodeLink('   ')).toBe(false);
    });

    it('should be case insensitive for protocols', () => {
      ['VMess://', 'vmess://', 'VMESS://', 'SS://', 'ss://'].forEach(protocol => {
        expect(isValidNodeLink(protocol + 'data')).toBe(true);
      });
    });
  });

  describe('NODE_TYPES constant', () => {
    it('should have all required node types', () => {
      expect(NODE_TYPES).toHaveProperty('VMess', 'vmess://');
      expect(NODE_TYPES).toHaveProperty('SS', 'ss://');
      expect(NODE_TYPES).toHaveProperty('VLESS', 'vless://');
      expect(NODE_TYPES).toHaveProperty('Trojan', 'trojan://');
      expect(NODE_TYPES).toHaveProperty('Hysteria2', 'hysteria2://');
      expect(NODE_TYPES).toHaveProperty('TUIC', 'tuic://');
      expect(NODE_TYPES).toHaveProperty('SNELL', 'snell,');
    });

    it('should have consistent format for protocol prefixes', () => {
      Object.values(NODE_TYPES).forEach(prefix => {
        expect(typeof prefix).toBe('string');
        expect(prefix.length).toBeGreaterThan(0);
        if (prefix !== 'snell,') {
          expect(prefix).toMatch(/^[a-z]+:\/\//);
        }
      });
    });
  });

  describe('parseNodeContent', () => {
    it('should parse single node from text', () => {
      const content = 'vmess://eyJ2IjoiV...';
      const result = parseNodeContent(content);
      expect(result).toEqual(['vmess://eyJ2IjoiV...']);
    });

    it('should parse multiple nodes from text', () => {
      const content = `vmess://eyJ2IjoiV...
ss://YWRtaW4
vless://uuid@server:port`;
      const result = parseNodeContent(content);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('vmess://eyJ2IjoiV...');
      expect(result[1]).toBe('ss://YWRtaW4');
      expect(result[2]).toBe('vless://uuid@server:port');
    });

    it('should filter empty lines', () => {
      const content = `vmess://eyJ2IjoiV...

ss://YWRtaW4

vless://uuid@server:port

`;
      const result = parseNodeContent(content);
      expect(result).toHaveLength(3);
      expect(result).not.toContain('');
    });

    it('should trim whitespace from lines', () => {
      const content = `  vmess://eyJ2IjoiV...  
   ss://YWRtaW4  
vless://uuid@server:port   `;
      const result = parseNodeContent(content);
      expect(result).toEqual([
        'vmess://eyJ2IjoiV...',
        'ss://YWRtaW4',
        'vless://uuid@server:port'
      ]);
    });

    it('should handle mixed line endings', () => {
      const content = 'vmess://link1\r\nss://link2\nvless://link3\r\nvmess://link4';
      const result = parseNodeContent(content);
      expect(result).toHaveLength(4);
      expect(result[0]).toBe('vmess://link1');
      expect(result[1]).toBe('ss://link2');
      expect(result[2]).toBe('vless://link3');
      expect(result[3]).toBe('vmess://link4');
    });

    it('should return empty array for empty input', () => {
      expect(parseNodeContent('')).toEqual([]);
      expect(parseNodeContent('\n\r')).toEqual([]);
      expect(parseNodeContent('   \n\r   ')).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      expect(parseNodeContent(null)).toEqual([]);
      expect(parseNodeContent(undefined)).toEqual([]);
    });

    it('should handle very long content', () => {
      const lines = [];
      for (let i = 0; i < 1000; i++) {
        lines.push(`vmess://link${i}`);
      }
      const content = lines.join('\n');
      const result = parseNodeContent(content);
      expect(result).toHaveLength(1000);
    });
  });
});