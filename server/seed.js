require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');

const exercises = [
  // ---- CHEST ----
  {
    name: 'Bench Press', nameEn: 'Bench Press', muscleGroup: 'Chest', difficulty: 'intermediate', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop',
    youtubeVideoId: 'rT7DgCr-3pg',
    description: 'ท่าพื้นฐานสำหรับกล้ามอก นอนราบบนม้านั่ง จับบาร์เบลกว้างกว่าไหล่เล็กน้อย ดันขึ้นและลงช้าๆ',
    steps: [
      'นอนราบบนม้านั่ง กางขาออกวางเท้าราบกับพื้น',
      'จับบาร์เบลกว้างกว่าไหล่ เกร็งหลังให้แอ่นเล็กน้อย',
      'หย่อนบาร์ลงมาแตะหน้าอก ข้อศอกทำมุม 45-75 องศา',
      'ดันบาร์ขึ้นสุดแขน เกร็งอกค้างไว้ 1 วินาที',
    ],
    warnings: ['อย่า bounce บาร์บนหน้าอก', 'ต้องมีคนช่วยประกบเสมอเมื่อใช้น้ำหนักมาก'],
  },
  {
    name: 'Push Up', nameEn: 'Push Up', muscleGroup: 'Chest', difficulty: 'beginner', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400&auto=format&fit=crop',
    youtubeVideoId: 'IODxDxX7oi4',
    description: 'ท่าวิดพื้นพื้นฐาน ฝึกได้ทุกที่ไม่ต้องใช้อุปกรณ์ ช่วยเสริมกล้ามอก ไหล่ และ tricep',
    steps: [
      'คว่ำมือลงพื้น กางมือกว้างกว่าไหล่เล็กน้อย',
      'เหยียดขา ลำตัวตรง จากศีรษะถึงส้นเท้า',
      'งอข้อศอกลดหน้าอกใกล้พื้น (ไม่แตะ)',
      'ดันตัวขึ้นสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่าให้สะโพกหย่อนลงหรือยกขึ้น', 'รักษาแนวลำตัวตรงตลอด'],
  },
  {
    name: 'Cable Fly', nameEn: 'Cable Fly', muscleGroup: 'Chest', difficulty: 'intermediate', verified: false,
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop',
    youtubeVideoId: 'taI4XduLpTk',
    description: 'ท่า isolation สำหรับกล้ามอก ช่วย stretch กล้ามเนื้อได้เต็มที่',
    steps: [
      'ยืนตรงกลางเครื่อง Cable ดึงสายมาระดับบน',
      'กางแขนออก จับ handle ทั้งสองข้าง',
      'ดึงสายมารวมกันด้านหน้าหน้าอก',
      'ค่อยๆ คืนสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่างัดข้อศอกตรง ให้งอเล็กน้อยตลอด'],
  },

  // ---- ARM ----
  {
    name: 'Bicep Curl', nameEn: 'Bicep Curl', muscleGroup: 'Arm', difficulty: 'beginner', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop',
    youtubeVideoId: 'ykJmrZ5v0Oo',
    description: 'ท่าพื้นฐานสำหรับกล้ามต้นแขนด้านหน้า (Bicep) ใช้ดัมเบลหรือบาร์เบล',
    steps: [
      'ยืนตรง หลังตรง จับดัมเบลสองข้าง แขนห้อยข้างลำตัว',
      'งอข้อศอกยกดัมเบลขึ้นมาระดับไหล่',
      'เกร็ง Bicep ค้างไว้ 1 วินาที',
      'ค่อยๆ ลดดัมเบลลงสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่าแกว่งลำตัว', 'อย่าให้ข้อศอกเคลื่อน ให้ชิดลำตัวตลอด'],
  },
  {
    name: 'Tricep Dip', nameEn: 'Tricep Dip', muscleGroup: 'Arm', difficulty: 'intermediate', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&auto=format&fit=crop',
    youtubeVideoId: 'wjUmnZH528Y',
    description: 'ท่าสำหรับกล้ามต้นแขนด้านหลัง (Tricep) ใช้ bench หรือ parallel bars',
    steps: [
      'วางมือบน bench หรือ bar กว้างเท่าไหล่',
      'ยืดแขนค้ำตัว ขาเหยียดออกด้านหน้า',
      'งอข้อศอกลดตัวลง ข้อศอกทำมุม 90 องศา',
      'ดันตัวขึ้นสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่าลดตัวต่ำเกินไปจะทำร้ายไหล่', 'รักษาลำตัวตรง'],
  },

  // ---- LEG ----
  {
    name: 'Squat', nameEn: 'Squat', muscleGroup: 'Leg', difficulty: 'beginner', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=400&auto=format&fit=crop',
    youtubeVideoId: 'ultWZbUMPL8',
    description: 'ราชินีแห่งท่าออกกำลังกายขา ฝึก Quadriceps, Hamstrings, Glutes พร้อมกัน',
    steps: [
      'ยืนกางขาเท่าไหล่หรือกว้างกว่าเล็กน้อย ปลายเท้าชี้ออก 15-30 องศา',
      'เกร็งหน้าท้อง หลังตรง ตามองตรง',
      'นั่งลงช้าๆ เข่าตามแนวปลายเท้า จนต้นขาขนานพื้น',
      'ดันพื้นลุกขึ้นสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่าให้เข่าพับเข้าด้านใน', 'อย่าก้มหน้า ให้ตามองตรงหรือขึ้นเล็กน้อย'],
  },
  {
    name: 'Leg Press', nameEn: 'Leg Press', muscleGroup: 'Leg', difficulty: 'beginner', verified: false,
    imageUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400&auto=format&fit=crop',
    youtubeVideoId: 'IZxyjW7MPJQ',
    description: 'ท่า Leg Press บนเครื่อง ปลอดภัยสำหรับผู้เริ่มต้น ฝึก Quadriceps เป็นหลัก',
    steps: [
      'นั่งบนเครื่อง วางเท้ากลางบนแผ่น กว้างเท่าไหล่',
      'ปล่อยที่ล็อก งอเข่าลดน้ำหนักลง',
      'ดันน้ำหนักขึ้นโดยไม่ล็อกเข่าตรงสุด',
      'ทำซ้ำตามจำนวน rep',
    ],
    warnings: ['อย่าล็อกเข่าตรงสุด', 'อย่าให้เข่าพับเข้าด้านใน'],
  },

  // ---- BACK ----
  {
    name: 'Deadlift', nameEn: 'Deadlift', muscleGroup: 'Back', difficulty: 'advanced', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a04?w=400&auto=format&fit=crop',
    youtubeVideoId: 'op9kVnSso6Q',
    description: 'ท่าที่ฝึกกล้ามเนื้อได้มากที่สุด ครอบคลุม Lower Back, Hamstrings, Glutes, Traps',
    steps: [
      'ยืนกางขาเท่าสะโพก บาร์วางเหนือกลางเท้า',
      'โค้งตัวจับบาร์ กว้างกว่าขาเล็กน้อย หลังตรง',
      'เกร็งหน้าท้อง ดึงบาร์ขึ้นตามแนวขา',
      'ยืดสะโพกและหัวเข่าพร้อมกัน จนตัวตรง',
    ],
    warnings: ['ห้ามหลังงองู', 'บาร์ต้องชิดขาตลอดการยก', 'ควรฝึกเทคนิคด้วยน้ำหนักเบาก่อน'],
  },
  {
    name: 'Pull Up', nameEn: 'Pull Up', muscleGroup: 'Back', difficulty: 'intermediate', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=400&auto=format&fit=crop',
    youtubeVideoId: 'eGo4IYlbE5g',
    description: 'ท่าดึงข้อ ฝึก Latissimus Dorsi และ Biceps ได้ดีเยี่ยม',
    steps: [
      'จับบาร์กว้างกว่าไหล่ หงายมือออก',
      'ห้อยตัวลง ไหล่ห่อเล็กน้อย',
      'ดึงตัวขึ้นจนคางพ้นบาร์ เกร็งหลังส่วนบน',
      'ค่อยๆ ลดตัวลงสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่าแกว่งตัว', 'อย่าล็อกข้อศอกตรงสุดในท่าล่าง'],
  },

  // ---- SHOULDER ----
  {
    name: 'Overhead Press', nameEn: 'Overhead Press', muscleGroup: 'Shoulder', difficulty: 'intermediate', verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=400&auto=format&fit=crop',
    youtubeVideoId: 'F3QY5vMz_6I',
    description: 'ท่าดันศีรษะ ฝึก Deltoid ทั้ง 3 หัว และ Trapezius',
    steps: [
      'ยืนหรือนั่ง จับบาร์หน้าอกระดับคอ กว้างกว่าไหล่',
      'เกร็งหน้าท้อง ดันบาร์ขึ้นเหนือศีรษะ',
      'ยืดแขนสุดแต่ไม่ล็อกข้อศอก',
      'ค่อยๆ ลดบาร์กลับระดับคอ',
    ],
    warnings: ['อย่าเอนหลังแอ่น', 'อย่าใช้ขาช่วยดัน'],
  },
  {
    name: 'Lateral Raise', nameEn: 'Lateral Raise', muscleGroup: 'Shoulder', difficulty: 'beginner', verified: false,
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop',
    youtubeVideoId: '3VcKaXpzqRo',
    description: 'ท่า isolation สำหรับ Side Deltoid ช่วยให้ไหล่กว้าง',
    steps: [
      'ยืนตรง จับดัมเบลสองข้าง แขนห้อยข้างลำตัว',
      'ยกแขนทั้งสองข้างออกด้านข้างพร้อมกัน',
      'ยกจนระดับไหล่ ข้อศอกงอเล็กน้อย',
      'ค่อยๆ ลดแขนลงสู่ท่าเริ่มต้น',
    ],
    warnings: ['อย่ายักไหล่ขณะยก', 'ใช้น้ำหนักเบา ควบคุมการเคลื่อนไหวให้ช้า'],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Exercise.deleteMany({});
  console.log('Cleared existing exercises');

  await Exercise.insertMany(exercises);
  console.log(`Seeded ${exercises.length} exercises`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(console.error);
