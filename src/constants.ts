
import { Student, Question, Reward } from './types';

export const MOCK_STUDENTS: Student[] = [
  { id: '10001', name: 'นายรักสอน ขยันเรียน', avatar: '👨‍🏫', stars: 120, school: 'ศูนย์ติวคุรุมาสเตอร์', inventory: [] },
  { id: '10002', name: 'น.ส.มานี มีวินัย', avatar: '👩‍🏫', stars: 150, school: 'ศูนย์ติวคุรุมาสเตอร์', inventory: [] },
];

export const CREATIVE_REWARDS: Reward[] = [
    { id: 'r1', name: 'E-Book สรุปกฎหมายครู', cost: 30, icon: '📚', description: 'ไฟล์ PDF สรุปประเด็นสำคัญที่มักออกสอบ', category: 'E-Book' },
    { id: 'r2', name: 'คอร์สเจาะลึก ภาค ก', cost: 50, icon: '🎥', description: 'วิดีโอติวเข้มรายวิชาโดยผู้เชี่ยวชาญ', category: 'Course' },
    { id: 'r3', name: 'เหรียญตรา "ว่าที่ครูผู้ช่วย"', cost: 10, icon: '🎖️', description: 'เหรียญเกียรติยศประดับโปรไฟล์', category: 'Badge' },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subject: 'กฎหมายการศึกษา',
    // Updated from 'PART_B' to 'PART_B_PROFESSIONAL' to match AssignmentCategory union
    category: 'PART_B_PROFESSIONAL',
    text: 'พระราชบัญญัติการศึกษาแห่งชาติ พ.ศ. 2542 มีการแก้ไขเพิ่มเติมถึงปัจจุบันกี่ฉบับ?',
    choices: [
      { id: '1', text: '2 ฉบับ' },
      { id: '2', text: '3 ฉบับ' },
      { id: '3', text: '4 ฉบับ' },
      { id: '4', text: '5 ฉบับ' },
    ],
    correctChoiceId: '3',
    explanation: 'พ.ร.บ.การศึกษาแห่งชาติ 2542 มีการแก้ไขเพิ่มเติมรวมเป็น 4 ฉบับ ล่าสุดคือฉบับที่ 4 พ.ศ. 2562',
  },
  {
    id: 'q2',
    subject: 'ภาษาอังกฤษ',
    category: 'PART_A',
    text: 'Choose the correct sentence:',
    choices: [
      { id: '1', text: 'The teacher has teach for many years.' },
      { id: '2', text: 'The teacher have taught for many years.' },
      { id: '3', text: 'The teacher has taught for many years.' },
      { id: '4', text: 'The teacher is teach for many years.' },
    ],
    correctChoiceId: '3',
    explanation: 'โครงสร้าง Present Perfect คือ Subject + has/have + V3',
  },
  {
    id: 'q3',
    subject: 'คุณธรรมจริยธรรม',
    category: 'PART_A',
    text: 'ข้อใดคือหลักการบริหารกิจการบ้านเมืองที่ดี (Good Governance)?',
    choices: [
      { id: '1', text: 'หลักนิติธรรม' },
      { id: '2', text: 'หลักความโปร่งใส' },
      { id: '3', text: 'หลักความคุ้มค่า' },
      { id: '4', text: 'ถูกทุกข้อ' },
    ],
    correctChoiceId: '4',
    explanation: 'ธรรมาภิบาลประกอบด้วย 6 หลักการ: นิติธรรม, คุณธรรม, โปร่งใส, มีส่วนร่วม, รับผิดชอบ, และคุ้มค่า',
  }
];
