import React, { useContext, useState, useRef } from 'react';
import { 
    View, StyleSheet, ScrollView, Alert, 
    KeyboardAvoidingView, Platform 
} from 'react-native';
import { 
    Text, TextInput, Button, Surface, 
    HelperText, IconButton 
} from 'react-native-paper';
import { useAuthService } from "@/servicesdb/authService";
import { useRouter } from 'expo-router';
import { UserContext } from '@/components/UserContext';

const COLORS = {
    bg: '#121212',
    cardBg: '#1e1e1e',
    accent: '#39FF14', 
    textMain: '#ffffff',
    textSecondary: '#aaaaaa',
    stars: '#FFD700'
};

export default function SugerenciasScreen() {
    const { users } = useContext(UserContext);
    const { enviarSugerenciaService } = useAuthService();
    const router = useRouter();
    
    const [comentario, setComentario] = useState('');
    const [calificacion, setCalificacion] = useState(5);
    const [loading, setLoading] = useState(false);
    const MAX_CHARS = 500;

    // Control de cambio de texto optimizado
    const handleTextChange = (text: string) => {
        // Al usar maxLength en el componente, 'text' ya viene limitado por el sistema
        // pero mantenemos esto por seguridad para asegurar el conteo exacto.
        setComentario(text);
    };

    const handleEnviar = async () => {
        if (comentario.trim().length < 5) {
            Alert.alert("Aviso", "Por favor, escribe una sugerencia detallada.");
            return;
        }

        const gymId = users?.GimnasioActual || users?.gymId || users?.IdGym;

        setLoading(true);
        try {
            const res = await enviarSugerenciaService(comentario, calificacion, gymId);
            Alert.alert("¡Gracias!", res.Message || "Recibimos tu opinión.");
            setComentario('');
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo enviar la sugerencia.");
        } finally {
            setLoading(false);
        }
    };

    const renderEstrellas = () => (
        <View style={styles.starsContainer}>
            <Text style={styles.labelStars}>¿Cómo fue tu experiencia?</Text>
            <View style={{ flexDirection: 'row' }}>
                {[1, 2, 3, 4, 5].map((estrella) => (
                    <IconButton
                        key={estrella}
                        icon={estrella <= calificacion ? "star" : "star-outline"}
                        iconColor={estrella <= calificacion ? COLORS.stars : "#555"}
                        size={36}
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
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text variant="headlineSmall" style={styles.title}>
                    Dinos qué piensas
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Tu opinión nos ayuda a mejorar la experiencia en tu sucursal y en la aplicación.
                </Text>

                <Surface style={styles.card} elevation={2}>
                    {renderEstrellas()}

                    <TextInput
                        label="Escribe aquí tu comentario..."
                        value={comentario}
                        onChangeText={handleTextChange}
                        mode="outlined"
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        style={styles.input}
                        textColor={COLORS.textMain}
                        outlineColor="#333"
                        activeOutlineColor={COLORS.accent}
                        placeholderTextColor="#666"
                        placeholder="Ej: Me gustaría que hubiera más equipo de cardio..."
                        // ESTO ES CLAVE: Impide que el sistema pegue más de 500 caracteres
                        maxLength={MAX_CHARS} 
                        // Evita que el teclado cambie el diseño al escribir rápido
                        blurOnSubmit={false}
                    />
                    
                    <View style={styles.footerRow}>
                        <HelperText type="info" visible={true} style={{ color: COLORS.textSecondary, paddingLeft: 0 }}>
                            Mínimo 5 caracteres
                        </HelperText>
                        <Text style={[
                            styles.counter, 
                            comentario.length >= MAX_CHARS && { color: COLORS.accent, fontWeight: 'bold' }
                        ]}>
                            {comentario.length} / {MAX_CHARS}
                        </Text>
                    </View>

                    <Button 
                        mode="contained" 
                        onPress={handleEnviar}
                        loading={loading}
                        disabled={loading || comentario.trim().length < 5}
                        style={styles.button}
                        buttonColor={COLORS.accent}
                        textColor="#000"
                        contentStyle={{ height: 50 }}
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
        backgroundColor: COLORS.bg,
    },
    content: {
        padding: 24,
        paddingTop: 20,
    },
    title: {
        fontWeight: 'bold',
        color: COLORS.textMain,
        marginBottom: 8,
    },
    subtitle: {
        color: COLORS.textSecondary,
        marginBottom: 30,
        lineHeight: 22,
    },
    card: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: COLORS.cardBg,
    },
    starsContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    labelStars: {
        fontSize: 16,
        color: COLORS.textMain,
        marginBottom: 8,
        fontWeight: '600'
    },
    input: {
        backgroundColor: COLORS.cardBg,
        minHeight: 180,
        fontSize: 16,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 20,
    },
    counter: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    button: {
        borderRadius: 14,
        elevation: 4,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 5,
    },
});