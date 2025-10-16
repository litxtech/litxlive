import React from 'react';

if (!(React && (React).use)) {
  (React).use = React.useContext.bind(React);
}

export { default } from 'expo-router/entry';
