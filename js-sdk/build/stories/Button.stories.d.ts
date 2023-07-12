import type { StoryObj } from '@storybook/html';
import type { ButtonProps } from './Button';
declare const meta: {
    title: string;
    tags: string[];
    render: (args: ButtonProps) => HTMLButtonElement;
    argTypes: {
        backgroundColor: {
            control: string;
        };
        label: {
            control: string;
        };
        onClick: {
            action: string;
        };
        primary: {
            control: string;
        };
        size: {
            control: {
                type: string;
            };
            options: string[];
        };
    };
};
export default meta;
type Story = StoryObj<ButtonProps>;
export declare const Primary: Story;
export declare const Secondary: Story;
export declare const Large: Story;
export declare const Small: Story;
