// firebase/config.ts

declare global {
    interface Window {
        firebase: any;
    }
}



// ATENÇÃO: Substitua estas informações pelas credenciais do seu projeto Firebase.
// Você pode encontrar estas credenciais no Console do Firebase em:
// Configurações do Projeto > Geral > Seus apps > Configuração do SDK.
// IMPORTANTE: Nunca commite credenciais reais no código. Use variáveis de ambiente.
const firebaseConfig = {
  apiKey: (globalThis as any).process?.env?.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: (globalThis as any).process?.env?.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: (globalThis as any).process?.env?.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: (globalThis as any).process?.env?.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: (globalThis as any).process?.env?.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: (globalThis as any).process?.env?.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
};

let dbInstance: any = null;

export const getFirebaseDb = () => {
    if (dbInstance) {
        return dbInstance;
    }

    if (typeof window.firebase === 'undefined') {
        const errorMsg = "SDK do Firebase não carregado. Verifique os scripts no index.html e sua conexão com a internet.";
        console.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    if (!window.firebase.apps.length) {
        try {
            // Check for placeholder config before initializing
            if (firebaseConfig.apiKey.startsWith("AIzaSy...")) {
                 const errorMsg = "A configuração do Firebase parece ser um placeholder. Por favor, adicione suas credenciais reais no arquivo firebase/config.ts.";
                 console.error(errorMsg);
                 alert(errorMsg);
                 throw new Error(errorMsg);
            }
            window.firebase.initializeApp(firebaseConfig);
        } catch (e) {
            console.error("A inicialização do Firebase falhou:", e);
            alert("A configuração do Firebase está incorreta. Verifique o console para mais detalhes.");
            throw e;
        }
    }

    dbInstance = window.firebase.firestore();
    return dbInstance;
};
