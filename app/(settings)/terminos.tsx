import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
// Importa esto para manejar los espacios del sistema
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
    bg: '#121212',
    cardBg: '#1e1e1e',
    accent: '#39FF14', 
    textMain: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#333333'
};

const TerminosScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets(); // Obtiene el tamaño de la barra de navegación

    return (
        <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.updateText}>Última actualización: Julio de 2025</Text>
                
                <Text style={styles.title}>Términos y Condiciones de Uso de FIXSKALE</Text>
                
                <Text style={styles.paragraph}>
                    Las presentes condiciones generales de uso e información legal regulan el acceso y el uso del software FIXSKALE... INFEMOV es la titular del Software.
                </Text>

                <Text style={styles.sectionTitle}>1. Condiciones Generales</Text>
                <Text style={styles.paragraph}>
                    El acceso y uso de FIXSKALE implican la aceptación plena y sin reservas de estas Condiciones Generales.
                </Text>

                <Text style={styles.sectionTitle}>2. Definiciones</Text>
                <View style={styles.bulletContainer}>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Software:</Text> Sistema web de gestión digital denominado "FIXSKALE".</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Cliente:</Text> Persona moral o física con actividad empresarial con licencia de uso.</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Usuario:</Text> Persona física que accede por invitación o voluntad propia.</Text>
                </View>

                <Text style={styles.sectionTitle}>4. Condiciones de Uso</Text>
                <Text style={styles.paragraph}>
                    Durante la vigencia del plan, el Cliente tendrá derecho no exclusivo, revocable e intransferible de utilizar el Software. Se requiere conexión a internet para su funcionamiento.
                </Text>

                <Text style={styles.sectionTitle}>18. Ley Aplicable y Jurisdicción</Text>
                <Text style={styles.paragraph}>
                    Se regirán de acuerdo con las leyes de los Estados Unidos Mexicanos. Las partes se someten a la jurisdicción de los tribunales en Ciudad Obregón, Sonora.
                </Text>
            </ScrollView>

            {/* Aplicamos el inset inferior al footer */}
            <View style={[
                styles.footer, 
                { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }
            ]}>
                <Button 
                    mode="contained" 
                    onPress={() => router.back()} 
                    buttonColor={COLORS.accent} 
                    textColor="#000"
                    style={styles.button}
                    contentStyle={{ height: 48 }}
                >
                    Cerrar
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { 
        flex: 1, 
        backgroundColor: COLORS.bg 
    },
    container: { 
        flex: 1 
    },
    content: { 
        padding: 24, 
        paddingBottom: 40 
    },
    updateText: { 
        fontSize: 12, 
        color: COLORS.textSecondary, 
        marginBottom: 10,
        fontStyle: 'italic' 
    },
    title: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: COLORS.accent, 
        marginBottom: 15 
    },
    sectionTitle: { 
        fontSize: 17, 
        fontWeight: 'bold', 
        marginTop: 25, 
        marginBottom: 10, 
        color: COLORS.textMain 
    },
    paragraph: { 
        fontSize: 14, 
        lineHeight: 22, 
        color: COLORS.textSecondary, 
        textAlign: 'justify', 
        marginBottom: 12 
    },
    bulletContainer: {
        marginVertical: 10
    },
    bullet: { 
        fontSize: 14, 
        lineHeight: 22,
        marginLeft: 10, 
        marginBottom: 10, 
        color: COLORS.textSecondary 
    },
    bold: { 
        fontWeight: 'bold', 
        color: COLORS.textMain 
    },
    footer: { 
        paddingHorizontal: 20,
        paddingTop: 15, // Espacio arriba del botón
        borderTopWidth: 1, 
        borderColor: COLORS.border,
        backgroundColor: COLORS.bg
    },
    button: { 
        borderRadius: 12,
        elevation: 2
    }
});

export default TerminosScreen;