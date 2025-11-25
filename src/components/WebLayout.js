import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

export const WebLayout = ({ children }) => {
    const { width } = useWindowDimensions();
    // Consider desktop if running on web and width is greater than a typical tablet width
    const isWebDesktop = Platform.OS === 'web' && width > 768;

    if (!isWebDesktop) {
        return <View style={{ flex: 1 }}>{children}</View>;
    }

    return (
        <View style={styles.container}>
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
        // Removed background color to let the app's background show through
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 1200, // Desktop-ready width
        height: '100%',
        // Removed shadows, border radius, and background color
        // This makes the container "invisible" but keeps the layout constrained
    },
});
