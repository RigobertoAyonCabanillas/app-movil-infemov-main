import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Text, Card, Avatar, Surface } from 'react-native-paper';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function ReservacionesScreen() {
  // Generamos un rango de 60 días (30 atrás y 30 adelante) para dar sensación de infinitud
  const [dias] = useState(Array.from({ length: 60 }, (_, i) => addDays(new Date(), i - 30)));

  // Datos de prueba: Solo hay algo hoy
  const hoy = new Date();
  const misReservas = [
    { id: '1', clase: 'Entrenamiento Funcional', hora: '08:00 AM', fecha: hoy },
  ];

  const renderPaginaDia = ({ item: fecha }: { item: Date }) => {
    // Buscamos si hay reservas que coincidan con este día del slider
    const reservasDelDia = misReservas.filter(res => isSameDay(res.fecha, fecha));

    return (
      <View style={styles.page}>
        {/* Cabecera con Día, Mes y Año */}
        <Surface style={styles.headerContainer} elevation={1}>
          <Text variant="labelLarge" style={styles.textAno}>{format(fecha, 'yyyy')}</Text>
          <Text variant="headlineSmall" style={styles.textFecha}>
            {format(fecha, "EEEE, d 'de' MMMM", { locale: es })}
          </Text>
        </Surface>

        <FlatList
          data={reservasDelDia}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card} mode="elevated">
              <Card.Title
                title={item.clase}
                subtitle={item.hora}
                left={(props) => <Avatar.Icon {...props} icon="calendar-check" style={styles.icon} />}
              />
            </Card>
          )}
          // Mensaje cuando no hay nada en esa fecha
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Avatar.Icon size={80} icon="calendar-blank" style={styles.emptyIcon} />
              <Text variant="bodyLarge" style={styles.emptyText}>
                No tienes reservaciones para esta fecha.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={dias}
        renderItem={renderPaginaDia}
        keyExtractor={(item) => item.toISOString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // Empezar en la posición 30 (Hoy)
        initialScrollIndex={30}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#57595c' },
  page: { width: width, flex: 1 },
  headerContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#7e7676',
    alignItems: 'center',
  },
  textAno: { color: '#7da854', fontWeight: 'bold', letterSpacing: 2 },
  textFecha: { textTransform: 'capitalize', textAlign: 'center', marginTop: 5 },
  listContent: { paddingHorizontal: 20 },
  card: { marginBottom: 15, backgroundColor: '#868282' },
  icon: { backgroundColor: '#7da854' },
  // Estilos del mensaje vacío
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  emptyIcon: { backgroundColor: 'transparent' },
  emptyText: { textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
});