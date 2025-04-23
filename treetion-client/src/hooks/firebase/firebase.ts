// Firebase 설정
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, DocumentReference, DocumentData } from 'firebase/firestore';

// Firebase 구성
const firebaseConfig = {
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
 authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
 appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
 measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
* 주의: Firestore 권한 오류 해결을 위해 Firebase 콘솔에서 보안 규칙을 설정하세요:
* 
* rules_version = '2';
* service cloud.firestore {
*   match /databases/{database}/documents {
*     match /subscribers/{document=**} {
*       allow read, write: if true; // 개발용 설정, 실제 환경에서는 더 제한적인 규칙 필요
*     }
*   }
* }
*/

// 이메일 또는 전화번호 유효성 검사 함수
const isValidEmail = (email: string): boolean => {
 return email.includes('@');
};

const isValidPhoneNumber = (phone: string): boolean => {
 // 숫자, 하이픈, 괄호, 공백만 허용하고 최소 10자 이상
 const phoneRegex = /^[\d\s\-()]{10,}$/;
 return phoneRegex.test(phone);
};

interface ContactResult {
 success: boolean;
 id?: string;
 error?: string;
}

type ContactType = 'email' | 'phone';

// 연락처 저장 함수 (이메일 또는 전화번호)
export const saveContact = async (contact: string, type: ContactType): Promise<ContactResult> => {
 try {
   // 유효성 검사
   if (!contact) {
     throw new Error('연락처 정보를 입력해주세요.');
   }
   
   // 타입에 따른 유효성 검사
   if (type === 'email' && !isValidEmail(contact)) {
     throw new Error('유효한 이메일 주소를 입력해주세요.');
   } else if (type === 'phone' && !isValidPhoneNumber(contact)) {
     throw new Error('유효한 전화번호를 입력해주세요.');
   }
   
   // Firestore에 연락처 정보 저장
   const docRef: DocumentReference<DocumentData> = await addDoc(collection(db, 'subscribers'), {
     contactType: type,
     contactValue: contact,
     timestamp: new Date()
   });
   
   return { success: true, id: docRef.id };
 } catch (error) {
   console.error('연락처 저장 오류:', error);
   return { success: false, error: (error as Error).message };
 }
};

// 기존 함수 호환성 유지
export const saveEmail = async (email: string): Promise<ContactResult> => {
 return saveContact(email, 'email');
};

export default app;