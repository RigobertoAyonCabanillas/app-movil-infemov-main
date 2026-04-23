import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Datos simulados de tarjetas
const TARJETAS_MOCK = [
  { id: '1', tipo: 'Visa', ultimos4: '4242', banco: 'BBVA', color: '#1a237e' },
  { id: '2', tipo: 'Mastercard', ultimos4: '8810', banco: 'Santander', color: '#b71c1c' },
];

export default function TiendaScreen() {
  const [tarjetas, setTarjetas] = useState(TARJETAS_MOCK);

  const renderTarjeta = ({ item }: { item: typeof TARJETAS_MOCK[0] }) => (
    <View style={[styles.card, { backgroundColor: item.color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardBank}>{item.banco}</Text>
        <Ionicons name="card" size={30} color="white" />
      </View>
      <Text style={styles.cardNumber}>**** **** **** {item.ultimos4}</Text>
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.cardLabel}>TITULAR</Text>
          <Text style={styles.cardHolder}>USUARIO EJEMPLO</Text>
        </View>
        <Text style={styles.cardType}>{item.tipo}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.sectionTitle}>Métodos de Pago</Text>
      
      <FlatList
        data={tarjetas}
        renderItem={renderTarjeta}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={315} // Ancho de tarjeta + margen
      />

      <View style={styles.actionsContainer}>
        <Text style={styles.subTitle}>Opciones de gestión</Text>
        
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="#39FF14" />
          <Text style={styles.addButtonText}>Agregar nueva tarjeta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="logo-paypal" size={20} color="#fff" />
          </View>
          <Text style={styles.optionText}>PayPal</Text>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.optionText}>Pago en Efectivo (OXXO)</Text>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#39FF14" />
        <Text style={styles.infoText}>
          Tus datos bancarios están protegidos. Esta es una plataforma de pago segura.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    paddingHorizontal: 20 
  },
  sectionTitle: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    marginTop: 20 
  },
  subTitle: {
    color: '#888',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15
  },
  listContainer: { 
    paddingBottom: 20 
  },
  card: {
    width: 300,
    height: 180,
    borderRadius: 20,
    padding: 20,
    marginRight: 15,
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardBank: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  cardNumber: { 
    color: '#fff', 
    fontSize: 20, 
    letterSpacing: 3, 
    textAlign: 'center', 
    marginVertical: 10 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  cardLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.6
  },
  cardHolder: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '500'
  },
  cardType: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
  actionsContainer: { 
    marginTop: 30 
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 15,
    marginBottom: 20,
    borderStyle: 'dashed',
    justifyContent: 'center'
  },
  addButtonText: { 
    color: '#39FF14', 
    marginLeft: 10, 
    fontSize: 16,
    fontWeight: '600'
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionText: { 
    color: '#fff', 
    flex: 1, 
    marginLeft: 15, 
    fontSize: 16 
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#0a1a05',
    padding: 15,
    borderRadius: 12,
    marginTop: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3311'
  },
  infoText: { 
    color: '#39FF14', 
    fontSize: 12, 
    marginLeft: 12, 
    flex: 1,
    opacity: 0.8
  },
});