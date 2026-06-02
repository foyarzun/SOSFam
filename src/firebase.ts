import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  runTransaction
} from 'firebase/firestore';

// Configuración de Firebase obtenida de tu proyecto activo 'proyecto-sso-2026'
const firebaseConfig = {
  projectId: "proyecto-sso-2026",
  appId: "1:5358889297:web:1c7ba1fd78bfea76e58b70",
  storageBucket: "proyecto-sso-2026.firebasestorage.app",
  apiKey: "AIzaSyBlv7nNHl4qPOivFlYzSUnGzeX60w-6kIo",
  authDomain: "proyecto-sso-2026.firebaseapp.com",
  messagingSenderId: "5358889297"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Interfaces de Datos
export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  groupId: string | null;
  lastStatus: 'safe' | 'help' | 'unknown';
  statusComment?: string;
  lastUpdated: Timestamp;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface GroupDoc {
  groupId: string;
  groupName: string;
  groupCode: string;
  createdBy: string;
  createdAt: Timestamp;
}

// Iniciar sesión con Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Verificar si el usuario ya existe en Firestore para no sobrescribir su grupo
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Crear nuevo documento de usuario
      const newUserData: UserDoc = {
        uid: user.uid,
        name: user.displayName || 'Usuario SOSFam',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        groupId: null,
        lastStatus: 'unknown',
        lastUpdated: Timestamp.now(),
      };
      await setDoc(userRef, newUserData);
    } else {
      // Actualizar foto y nombre en caso de que hayan cambiado
      await updateDoc(userRef, {
        name: user.displayName || userSnap.data().name,
        photoURL: user.photoURL || userSnap.data().photoURL || null
      });
    }
    return user;
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    throw error;
  }
};

// Cerrar sesión
export const logout = () => signOut(auth);

// Asegurar que el documento de usuario existe en Firestore
export const ensureUserDoc = async (user: User): Promise<UserDoc> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const newUserData: UserDoc = {
      uid: user.uid,
      name: user.displayName || 'Usuario SOSFam',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      groupId: null,
      lastStatus: 'unknown',
      lastUpdated: Timestamp.now(),
    };
    await setDoc(userRef, newUserData);
    return newUserData;
  }
  
  return userSnap.data() as UserDoc;
};

// Actualizar el estado de bienestar del usuario
export const updateUserStatus = async (
  uid: string, 
  status: 'safe' | 'help', 
  comment?: string, 
  location?: { latitude: number; longitude: number; accuracy?: number }
) => {
  const userRef = doc(db, 'users', uid);
  const updateData: Partial<UserDoc> = {
    lastStatus: status,
    lastUpdated: Timestamp.now(),
    statusComment: comment || "",
  };

  if (location) {
    updateData.location = location;
  } else {
    // Si no hay nueva ubicación, podemos elegir mantener la anterior o eliminarla.
    // Para emergencias, mejor mantenerla o no actualizar ese campo.
  }

  await updateDoc(userRef, updateData);
};

// Crear un nuevo grupo familiar
export const createFamilyGroup = async (uid: string, groupName: string): Promise<string> => {
  // Generar código aleatorio de 6 dígitos único
  const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const groupId = Math.random().toString(36).substring(2, 15);

  const groupRef = doc(db, 'groups', groupId);
  const userRef = doc(db, 'users', uid);

  // Ejecutar transacción para asegurar consistencia
  await runTransaction(db, async (transaction) => {
    // 1. Crear el grupo
    const groupData: GroupDoc = {
      groupId,
      groupName,
      groupCode,
      createdBy: uid,
      createdAt: Timestamp.now()
    };
    transaction.set(groupRef, groupData);

    // 2. Asociar el usuario al grupo
    transaction.update(userRef, { groupId });
  });

  return groupCode;
};

// Unirse a un grupo mediante código de 6 dígitos
export const joinFamilyGroup = async (uid: string, groupCode: string): Promise<string> => {
  const cleanCode = groupCode.trim().toUpperCase();
  
  // Buscar el grupo por código
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('groupCode', '==', cleanCode));
  
  return new Promise((resolve, reject) => {
    // Realizamos una consulta rápida única
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      unsubscribe(); // Desuscribirse inmediatamente
      
      if (snapshot.empty) {
        reject(new Error("Código de grupo no encontrado. Verifica e intenta de nuevo."));
        return;
      }
      
      const groupDoc = snapshot.docs[0];
      const groupId = groupDoc.id;
      const groupName = groupDoc.data().groupName;
      
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { groupId });
        resolve(groupName);
      } catch (err) {
        reject(err);
      }
    }, (err) => {
      reject(err);
    });
  });
};

// Salir del grupo familiar actual
export const leaveFamilyGroup = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { groupId: null });
};

// Suscribirse a los datos de un usuario en tiempo real
export const subscribeToUserData = (
  uid: string, 
  callback: (data: UserDoc | null) => void,
  onError?: (err: any) => void
) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserDoc);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("Error en subscribeToUserData:", err);
    if (onError) onError(err);
  });
};

// Suscribirse a los miembros de la familia en tiempo real
export const subscribeToFamilyMembers = (
  groupId: string, 
  callback: (members: UserDoc[]) => void,
  onError?: (err: any) => void
) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('groupId', '==', groupId));
  
  return onSnapshot(q, (snapshot) => {
    const members: UserDoc[] = [];
    snapshot.forEach((doc) => {
      members.push(doc.data() as UserDoc);
    });
    callback(members);
  }, (err) => {
    console.error("Error en subscribeToFamilyMembers:", err);
    if (onError) onError(err);
  });
};

// Suscribirse a los detalles del grupo familiar
export const subscribeToGroupDetails = (
  groupId: string, 
  callback: (group: GroupDoc | null) => void,
  onError?: (err: any) => void
) => {
  const groupRef = doc(db, 'groups', groupId);
  return onSnapshot(groupRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GroupDoc);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("Error en subscribeToGroupDetails:", err);
    if (onError) onError(err);
  });
};
