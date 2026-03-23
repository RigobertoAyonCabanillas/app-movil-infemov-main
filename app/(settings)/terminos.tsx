import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Divider, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

const TerminosScreen = () => {
    const router = useRouter();

    return (
        <View style={styles.mainContainer}>
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
                <Text style={styles.bullet}>• <Text style={styles.bold}>Software:</Text> Sistema web de gestión digital denominado "FIXSKALE".</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Cliente:</Text> Persona moral o física con actividad empresarial con licencia de uso.</Text>
                <Text style={styles.bullet}>• <Text style={styles.bold}>Usuario:</Text> Persona física que accede por invitación o voluntad propia.</Text>

                <Text style={styles.sectionTitle}>4. Condiciones de Uso</Text>
                <Text style={styles.paragraph}>
                    Durante la vigencia del plan, el Cliente tendrá derecho no exclusivo, revocable e intransferible de utilizar el Software. Se requiere conexión a internet para su funcionamiento.
                </Text>

                <Text style={styles.sectionTitle}>18. Ley Aplicable y Jurisdicción</Text>
                <Text style={styles.paragraph}>
                    Se regirán de acuerdo con las leyes de los Estados Unidos Mexicanos. Las partes se someten a la jurisdicción de los tribunales en Ciudad Obregón, Sonora.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <Button mode="contained" onPress={() => router.back()} buttonColor="#99bc1a" style={styles.button}>
                    Cerrar
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    updateText: { fontSize: 12, color: '#666', marginBottom: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#FF3CAC', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 5, color: '#333' },
    paragraph: { fontSize: 14, lineHeight: 20, color: '#444', textAlign: 'justify', marginBottom: 10 },
    bullet: { fontSize: 14, marginLeft: 10, marginBottom: 8, color: '#444' },
    bold: { fontWeight: 'bold' },
    footer: { padding: 15, borderTopWidth: 1, borderColor: '#eee' },
    button: { borderRadius: 8 }
});

export default TerminosScreen;