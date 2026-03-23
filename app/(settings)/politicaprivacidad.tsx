import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

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
                <Text style={styles.bullet}>• <Text style={styles.bold}>Datos Proporcionados:</Text> Nombre, RFC, correo, teléfono y datos de pago.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Uso del Software:</Text> Funciones utilizadas, tiempo de permanencia e IP.</Text>

                <Text style={styles.sectionTitle}>2. Finalidad del Tratamiento</Text>
                <Text style={styles.paragraph}>
                    Utilizamos sus datos para proveer el servicio, gestionar su cuenta, procesar pagos, brindar soporte técnico y cumplir con obligaciones legales.
                </Text>

                <Text style={styles.sectionTitle}>7. Sus Derechos ARCO</Text>
                <Text style={styles.paragraph}>
                    Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición escribiendo a: 
                    <Text style={{color: '#FF3CAC'}}> vvelazco@infemov.com.mx</Text>
                </Text>

                <Text style={styles.sectionTitle}>5. Seguridad de los Datos</Text>
                <Text style={styles.paragraph}>
                    Hemos implementado medidas técnicas y físicas para proteger sus datos, aunque ninguna transmisión por internet es 100% segura.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <Button mode="contained" onPress={() => router.back()} buttonColor="#99bc1a" style={styles.button}>
                    He leído la política
                </Button>
            </View>
        </View>
    );
};

// Reutilizamos los mismos estilos para mantener coherencia visual
const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    updateText: { fontSize: 12, color: '#666', marginBottom: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#FF3CAC', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 5, color: '#333' },
    paragraph: { fontSize: 14, lineHeight: 22, color: '#444', textAlign: 'justify', marginBottom: 10 },
    bullet: { fontSize: 14, marginLeft: 10, marginBottom: 8, color: '#444' },
    bold: { fontWeight: 'bold' },
    footer: { padding: 15, borderTopWidth: 1, borderColor: '#eee' },
    button: { borderRadius: 8 }
});

export default PrivacidadScreen;