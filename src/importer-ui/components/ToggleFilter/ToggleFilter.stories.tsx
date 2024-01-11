import React from 'react';
import ToggleFilter from './index';

export default {
  title: 'User Interface/ToggleFilter',
  component: ToggleFilter,
  argTypes: {
    options: {
      control: {
        type: 'object'
      }
    },
    onChange: { action: 'changed' }
  }
};

export const Default = () => (
  <ToggleFilter 
    options={[
      { label: 'Option 1', filterValue: 'One', selected: true },
      { label: 'Option 2', filterValue: 'Two', selected: false },
      { label: 'Option 3', filterValue: 'Three', selected: false, color: "#F04438" }
    ]}
    onChange={(option) => console.log(option)}
  />
);

export const WithCustomOptions = () => (
  <ToggleFilter 
    options={[
      { label: 'Custom 1', filterValue: 'One', selected: false },
      { label: 'Custom 2', filterValue: 'Two', selected: true }
    ]}
    onChange={(option) => console.log(option)}
  />
);
