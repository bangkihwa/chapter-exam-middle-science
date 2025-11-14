const testString = `* 1번 🧬생명(물질) 정답 ③`;

const pattern1 = /\*\s+(\d+)번\s+(⚡️|🧪|🌍|🌎|🧬|⚛️|💡)\s*([^(]+)\(([^)]+)\)\s+정답\s+([①②③④⑤,\s]+)/g;

console.log('Test string:', testString);
console.log('Pattern:', pattern1);

const match = pattern1.exec(testString);
if (match) {
  console.log('Match found!');
  console.log('Groups:', match);
} else {
  console.log('No match!');
}

// Try simpler patterns
const pattern2 = /\*\s+(\d+)번/;
console.log('\nSimpler pattern (번까지):', pattern2.exec(testString));

const pattern3 = /🧬/;
console.log('Emoji pattern:', pattern3.exec(testString));

const pattern4 = /\*\s+(\d+)번\s+🧬/;
console.log('With emoji:', pattern4.exec(testString));

const pattern5 = /\*\s+(\d+)번\s+🧬생명/;
console.log('With category:', pattern5.exec(testString));

const pattern6 = /\*\s+(\d+)번\s+🧬생명\(([^)]+)\)/;
console.log('With unit:', pattern6.exec(testString));
