import type { StoryObj } from '@storybook/html';
import type { HeaderProps } from './Header';
declare const meta: {
    title: string;
    tags: string[];
    render: (args: HeaderProps) => HTMLElement;
    parameters: {
        layout: string;
    };
    argTypes: {
        onLogin: {
            action: string;
        };
        onLogout: {
            action: string;
        };
        onCreateAccount: {
            action: string;
        };
    };
};
export default meta;
type Story = StoryObj<HeaderProps>;
export declare const LoggedIn: Story;
export declare const LoggedOut: Story;
