import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, IconButton } from 'react-native-paper';
import { useAuthService } from "@/servicesdb/authService";
import { useRouter } from 'expo-router';
import { UserContext } from '@/components/UserContext';

export default function SugerenciasScreen() {

    const { users } = useContext(UserContext);
    
    const { enviarSugerenciaService } = useAuthService();
    const router = useRouter();
    
    const [comentario, setComentario] = useState('');
    const [calificacion, setCalificacion] = useState(5); // Estado para la calificación (1-5)
    const [loading, setLoading] = useState(false);
    const MAX_CHARS = 500;

    const handleEnviar = async () => {
    if (comentario.trim().length < 5) {
        Alert.alert("Aviso", "Por favor, escribe una sugerencia detallada.");
        return;
    }

    // Obtenemos el ID del gimnasio del usuario actual
    const gymId = users?.GimnasioActual || users?.gymId || users?.IdGym;

    setLoading(true);
    try {
        // Ahora enviamos 3 parámetros: comentario, calificación y el ID del gimnasio
        const res = await enviarSugerenciaService(comentario, calificacion, gymId);
        
        Alert.alert("¡Gracias!", res.Message || "Recibimos tu opinión.");
        setComentario('');
        router.back();
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setLoading(false);
    }
    };

    // Renderizado de las estrellas
    const renderEstrellas = () => (
        <View style={styles.starsContainer}>
            <Text style={styles.labelStars}>Califica tu experiencia:</Text>
            <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((estrella) => (
                    <IconButton
                        key={estrella}
                        icon={estrella <= calificacion ? "star" : "star-outline"}
                        iconColor={estrella <= calificacion ? "#FFD700" : "#888"}
                        size={32}
                        onPress={() => setCalificacion(estrella)}
                        style={{ margin: 0 }}
                    />
                ))}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text variant="headlineSmall" style={styles.title}>
                    Dinos qué piensas
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Tu opinión nos ayuda a mejorar la experiencia en tu sucursal y en la aplicación.
                </Text>

                <Surface style={styles.card} elevation={1}>
                    {/* Sección de Calificación */}
                    {renderEstrellas()}

                    <TextInput
                        label="Escribe aquí tu comentario..."
                        value={comentario}
                        onChangeText={(text) => {
                            if (text.length <= MAX_CHARS) setComentario(text);
                        }}
                        mode="outlined"
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        style={styles.input}
                        activeOutlineColor="#99bc1a"
                        placeholder="Ej: Me gustaría que hubiera más equipo de cardio..."
                    />
                    
                    <View style={styles.footerRow}>
                        <HelperText type="info" visible={true}>
                            Mínimo 5 caracteres
                        </HelperText>
                        <Text style={[styles.counter, comentario.length >= MAX_CHARS && { color: 'red' }]}>
                            {comentario.length} / {MAX_CHARS}
                        </Text>
                    </View>

                    <Button 
                        mode="contained" 
                        onPress={handleEnviar}
                        loading={loading}
                        disabled={loading || comentario.trim().length < 5}
                        style={styles.button}
                        buttonColor="#99bc1a"
                        contentStyle={{ height: 48 }}
                    >
                        {loading ? "Enviando..." : "Enviar Comentarios"}
                    </Button>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    title: {
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
        marginBottom: 24,
        lineHeight: 22,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
    },
    starsContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    labelStars: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        fontWeight: '500'
    },
    input: {
        backgroundColor: '#fff',
        minHeight: 180,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    counter: {
        fontSize: 12,
        color: '#888',
        marginRight: 8,
    },
    button: {
        borderRadius: 10,
        elevation: 2,
    },
});