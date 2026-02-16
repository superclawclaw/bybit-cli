import React from 'react';
import { render } from 'ink';

export function renderComponent(component: React.ReactElement): ReturnType<typeof render> {
  return render(component);
}
