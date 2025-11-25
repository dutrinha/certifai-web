import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const WebLayout = ({ children }) => {
    const { width } = useWindowDimensions();
    // Consider desktop if running on web and width is greater than a typical tablet width
    const isWebDesktop = Platform.OS === 'web' && width > 768;

    if (!isWebDesktop) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }}>{children}</View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 1440, // Increased max-width for a more spacious feel
        height: '100%',
        // On desktop, we can add a subtle shadow or border if we want a "card" look,
        // but for a landing page feel, full height with constraints is often better.
        // Let's keep it clean for now.
        backgroundColor: 'transparent',
    },
});
