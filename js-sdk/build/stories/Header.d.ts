import './header.css';
export interface HeaderProps {
    user?: {
        name: string;
    };
    onLogin: () => void;
    onLogout: () => void;
    onCreateAccount: () => void;
}
export declare const createHeader: ({ user, onLogout, onLogin, onCreateAccount }: HeaderProps) => HTMLElement;
