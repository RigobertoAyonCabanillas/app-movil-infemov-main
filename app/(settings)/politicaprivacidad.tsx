import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

// Colores consistentes con tu interfaz Dark/Neon
const COLORS = {
    bg: '#121212',
    cardBg: '#1e1e1e',
    accent: '#99bc1a',
    textMain: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#333333'
};

const PrivacidadScreen = () => {
    const router = useRouter();

    return (
        <View style={styles.mainContainer}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.updateText}>Última actualización: Julio de 2025</Text>
                
                <Text style={styles.title}>Política de Privacidad de FIXSKALE</Text>
                
                <Text style={styles.paragraph}>
                    <Text style={styles.bold}>INFORMACIÓN EN MOVIMIENTO S.A. de C.V. (INFEMOV)</Text>, con domicilio en Tlaxcala 230 Sur, Ciudad Obregón, Sonora, es responsable del tratamiento de sus datos personales.
                </Text>

                <Text style={styles.sectionTitle}>1. Información que Recopilamos</Text>
                <View style={styles.bulletContainer}>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Datos Proporcionados:</Text> Nombre, RFC, correo, teléfono y datos de pago.</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Uso del Software:</Text> Funciones utilizadas, tiempo de permanencia e IP.</Text>
                </View>

                <Text style={styles.sectionTitle}>2. Finalidad del Tratamiento</Text>
                <Text style={styles.paragraph}>
                    Utilizamos sus datos para proveer el servicio, gestionar su cuenta, procesar pagos, brindar soporte técnico y cumplir con obligaciones legales.
                </Text>

                <Text style={styles.sectionTitle}>7. Sus Derechos ARCO</Text>
                <Text style={styles.paragraph}>
                    Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición escribiendo a: 
                    <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}> vvelazco@infemov.com.mx</Text>
                </Text>

                <Text style={styles.sectionTitle}>5. Seguridad de los Datos</Text>
                <Text style={styles.paragraph}>
                    Hemos implementado medidas técnicas y físicas para proteger sus datos, aunque ninguna transmisión por internet es 100% segura.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <Button 
                    mode="contained" 
                    onPress={() => router.back()} 
                    buttonColor={COLORS.accent} 
                    textColor="#000"
                    style={styles.button}
                    contentStyle={{ height: 50 }}
                >
                    He leído la política
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
        padding: 20, 
        borderTopWidth: 1, 
        borderColor: COLORS.border,
        backgroundColor: COLORS.bg
    },
    button: { 
        borderRadius: 12,
        elevation: 4
    }
});

export default PrivacidadScreen;