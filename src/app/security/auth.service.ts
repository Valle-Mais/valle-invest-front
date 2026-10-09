// Compatibilidade: o serviço único vive em core/auth/auth.service.ts.
// Este arquivo existe só para o código legado que ainda importa daqui.
// Código novo importa de '@/app/core/auth/auth.service' (ou caminho relativo equivalente).
export { AuthService } from '../core/auth/auth.service';
