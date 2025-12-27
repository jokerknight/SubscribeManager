const { 
  safeBase64Encode, 
  safeBase64Decode, 
  safeDecodeURIComponent,
  filterSnellNodes,
  safeUtf8Decode
} = require('../utils');

describe('Helper Functions', () => {
  describe('safeBase64Encode', () => {
    it('should encode string to base64', () => {
      const input = 'Hello World';
      const result = safeBase64Encode(input);
      expect(result).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should encode empty string', () => {
      const result = safeBase64Encode('');
      expect(result).toBe('');
    });

    it('should encode special characters', () => {
      const input = 'Hello@#$%^&*()';
      const result = safeBase64Encode(input);
      expect(result).toBe('SGVsbG9AIyMkJV4mKigp');
    });

    it('should encode unicode characters', () => {
      const input = '你好世界';
      const result = safeBase64Encode(input);
      expect(result).toBe('5L2g5aW95LiW5Li6');
    });

    it('should handle numbers', () => {
      const input = '1234567890';
      const result = safeBase64Encode(input);
      expect(result).toBe('MTIzNDU2Nzg5MA==');
    });
  });

  describe('safeBase64Decode', () => {
    it('should decode base64 string', () => {
      const input = 'SGVsbG8gV29ybGQ=';
      const result = safeBase64Decode(input);
      expect(result).toBe('Hello World');
    });

    it('should return original string for invalid base64', () => {
      const input = 'invalid-base64!@#';
      const result = safeBase64Decode(input);
      expect(result).toBe(input);
    });

    it('should decode empty string', () => {
      const result = safeBase64Decode('');
      expect(result).toBe('');
    });

    it('should handle unicode characters', () => {
      const input = '5L2g5aW95LiW5Li6';
      const result = safeBase64Decode(input);
      expect(result).toBe('你好世界');
    });

    it('should decode special characters', () => {
      const input = 'SGVsbG9AIyMkJV4mKigp';
      const result = safeBase64Decode(input);
      expect(result).toBe('Hello@#$%^&*()');
    });

    it('should handle malformed base64 gracefully', () => {
      const inputs = [
        'SGVsbG8gV29ybGQ', // missing padding
        'SGVsbG8gV29ybGQ==', // extra padding
        '!!!SGVsbG8gV29ybGQ=', // invalid characters
        'SGVsbG8g V29ybGQ=' // space in middle
      ];

      inputs.forEach(input => {
        const result = safeBase64Decode(input);
        // Should not throw and should return something reasonable
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('safeDecodeURIComponent', () => {
    it('should decode URL encoded string', () => {
      const input = 'Hello%20World%20%26%20Test';
      const result = safeDecodeURIComponent(input);
      expect(result).toBe('Hello World & Test');
    });

    it('should return original string for malformed URI', () => {
      const input = 'Hello%ZZ%World';
      const result = safeDecodeURIComponent(input);
      expect(result).toBe(input);
    });

    it('should decode special characters', () => {
      const testCases = [
        { input: '%20', expected: ' ' },
        { input: '%21', expected: '!' },
        { input: '%40', expected: '@' },
        { input: '%23', expected: '#' },
        { input: '%26', expected: '&' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(safeDecodeURIComponent(input)).toBe(expected);
      });
    });

    it('should decode unicode characters', () => {
      const input = '%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C';
      const result = safeDecodeURIComponent(input);
      expect(result).toBe('你好世界');
    });

    it('should handle empty string', () => {
      const result = safeDecodeURIComponent('');
      expect(result).toBe('');
    });

    it('should handle normal strings without encoding', () => {
      const input = 'Hello World';
      const result = safeDecodeURIComponent(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('safeUtf8Decode', () => {
    it('should decode valid UTF-8 bytes', () => {
      const input = 'Hello World';
      const result = safeUtf8Decode(input);
      expect(result).toBe('Hello World');
    });

    it('should handle invalid UTF-8 sequences', () => {
      const invalidInputs = [
        '\x80\x81', // Invalid UTF-8 start
        '\xFF\xFE', // Invalid UTF-8 bytes
        '\xC0\x80' // Overlong encoding
      ];

      invalidInputs.forEach(input => {
        const result = safeUtf8Decode(input);
        // Should not throw and should return something
        expect(typeof result).toBe('string');
      });
    });

    it('should handle empty string', () => {
      const result = safeUtf8Decode('');
      expect(result).toBe('');
    });

    it('should handle unicode characters', () => {
      const input = '你好世界';
      const result = safeUtf8Decode(input);
      expect(result).toBe('你好世界');
    });

    it('should handle mixed valid/invalid sequences', () => {
      const input = 'Hello\x80World';
      const result = safeUtf8Decode(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('filterSnellNodes', () => {
    it('should filter out snell nodes', () => {
      const content = `vmess://link1
ss://link2
NodeName=snell,server,10000,cipher,password
vless://link4
AnotherNode=snell,server2,2000,cipher,password2`;
      const result = filterSnellNodes(content);
      const lines = result.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('vmess://link1');
      expect(lines[1]).toBe('ss://link2');
      expect(result).not.toContain('snell,');
    });

    it('should keep non-snell nodes', () => {
      const content = `vmess://link1
ss://link2
vless://link3
trojan://link4
hysteria2://link5`;
      const result = filterSnellNodes(content);
      expect(result).toBe(content);
    });

    it('should handle empty content', () => {
      expect(filterSnellNodes('')).toBe('');
      expect(filterSnellNodes(null)).toBe('');
      expect(filterSnellNodes(undefined)).toBe('');
    });

    it('should handle whitespace-only content', () => {
      const content = '   \n\r   \n\n   ';
      const result = filterSnellNodes(content);
      expect(result).toBe('');
    });

    it('should preserve line endings', () => {
      const content = `vmess://link1\r\nss://link2\nvless://link3`;
      const result = filterSnellNodes(content);
      expect(result).toBe('vmess://link1\r\nss://link2\nvless://link3');
    });

    it('should filter mixed snell and non-snell', () => {
      const content = `vmess://link1
snell://link2
NodeName=snell,server,port,cipher,pass
ss://link3
vless://link4
Test=snell,server2,port2,cipher2,pass2`;
      const result = filterSnellNodes(content);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('vmess://link1');
      expect(lines[1]).toBe('ss://link3');
      expect(lines[2]).toBe('vless://link4');
      expect(result).not.toContain('snell://link2');
      expect(result).not.toContain('NodeName=snell,');
      expect(result).not.toContain('Test=snell,');
    });

    it('should handle content with only snell nodes', () => {
      const content = `Node1=snell,server1,1000,cipher1,pass1
Node2=snell,server2,2000,cipher2,pass2`;
      const result = filterSnellNodes(content);
      expect(result).toBe('');
    });

    it('should trim lines before filtering', () => {
      const content = `  vmess://link1  
   ss://link2   
   NodeName=snell,server,port,cipher,password
  vless://link3  `;
      const result = filterSnellNodes(content);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('vmess://link1');
      expect(lines[1]).toBe('ss://link2');
      expect(lines[2]).toBe('vless://link3');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle large strings efficiently', () => {
      const largeContent = Array(1000).fill('vmess://testlink\n').join('');
      const startTime = Date.now();
      const result = filterSnellNodes(largeContent);
      const endTime = Date.now();
      
      expect(result).toContain('vmess://testlink');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle very long lines', () => {
      const longLine = 'vmess://' + 'a'.repeat(10000);
      const content = `${longLine}\n${longLine}\n`;
      const result = filterSnellNodes(content);
      expect(result).toContain(longLine);
    });

    it('should handle various whitespace combinations', () => {
      const whitespaceInputs = [
        'vmess://link1\n\tss://link2\n  vless://link3  \n\r',
        '\n\nvmess://link1\r\r\nss://link2\n\n',
        '   vmess://link1   \n   ss://link2   '
      ];

      whitespaceInputs.forEach(input => {
        const result = filterSnellNodes(input);
        expect(result).toContain('vmess://link1');
        expect(result).toContain('ss://link2');
        expect(result).not.toContain('snell,');
      });
    });
  });
});