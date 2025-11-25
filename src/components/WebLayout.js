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
        backgroundColor: '#f0f2f5', // Neutral background for the outer area
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 480, // Constrain to a comfortable mobile width
        backgroundColor: '#fff',
        // Add shadow to make it pop against the background
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        // Ensure it takes full height
        height: '100%',
        overflow: 'hidden', // Clip content to rounded corners if we added them
    },
});
