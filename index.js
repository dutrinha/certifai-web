console.log('Index.js is running');
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
    document.title = 'CertifAI';
}

registerRootComponent(App);
