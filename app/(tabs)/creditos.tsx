import { useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { DataTable, Searchbar, PaperProvider, Menu, Divider, TextInput, Button } from 'react-native-paper'; //Libreria de DataTable
import { Container, InfoCard, NavRow, IconButton } from "@/styles/creditosStyle";
import { Ionicons } from "@expo/vector-icons";
import { useAuthService } from "@/servicesdb/authService"; 
import * as schema from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';

export default function Creditos() {
    const [index, setIndex] = useState(0); 
    const [searchGlobal, setSearchGlobal] = useState('');
    
    // Paginación
    const [page, setPage] = useState(0);
    const [numberOfItemsPerPageList] = useState([5, 10, 20]);
    const [itemsPerPage, setItemsPerPage] = useState(numberOfItemsPerPageList[1]);
    const [menuPaginationVisible, setMenuPaginationVisible] = useState(false);

    // Filtros y Ordenamiento
    const [filtrosColumna, setFiltrosColumna] = useState<{[key: string]: string}>({});
    const [visibleMenu, setVisibleMenu] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [sortKey, setSortKey] = useState<string | null>(null);

    const { obtenerMembresiasLocal, obtenerCreditosLocal, obtenerUsuarioLocal, actualizarBaseDatosLocalMembresia, actualizarBaseDatosLocalCreditos} = useAuthService();

    const [listaMembresias, setListaMembresias] = useState<InferSelectModel<typeof schema.membresiasdb>[]>([]);
    const [listaCreditos, setListaCreditos] = useState<InferSelectModel<typeof schema.creditosdb>[]>([]);

    const alternarTab = () => {    
        setIndex((prev) => (prev === 0 ? 1 : 0));
        setPage(0);
        setFiltrosColumna({});
    };

    useFocusEffect(useCallback(() => {
    let isMounted = true;
    
    const cargar = async () => {
        // 1. Buscamos el usuario logueado en SQLite
        const usuarios = await obtenerUsuarioLocal();
        const usuarioActual = usuarios[0]; 

        if (usuarioActual && isMounted) {
            // Suponiendo que el gymId lo tienes guardado en el usuario
            // O si lo tienes en una variable de estado tras el login
            const gymId = usuarioActual.superUsuarioId; 

        // 2. Ahora pasamos AMBOS argumentos
        await actualizarBaseDatosLocalMembresia(usuarioActual.id, gymId);

            // 3. Sincronizamos Créditos (API -> SQLite) <--- ESTA ES LA QUE FALTABA
            await actualizarBaseDatosLocalCreditos(usuarioActual.id);

            // 4. Obtenemos de SQLite filtrando por ese ID para la UI
            const resM = await obtenerMembresiasLocal(usuarioActual.id);
            const resC = await obtenerCreditosLocal(usuarioActual.id);

            if (isMounted) {
                setListaMembresias(resM || []);
                setListaCreditos(resC || []);
            }
        }
    };

            cargar();
            return () => { isMounted = false; };
        }, []));


    // Define esto fuera de tu componente o antes del useMemo
    type FilaTabla = typeof listaCreditos[0] | typeof listaMembresias[0];
    const datosFinales = useMemo(() => {
        
        // Forzamos el tipo aquí para que acepte ambos casos
        let items: FilaTabla[] = index === 0 ? [...listaCreditos] : [...listaMembresias];

        if (searchGlobal) {
            items = items.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(searchGlobal.toLowerCase())));
        }
        Object.keys(filtrosColumna).forEach(key => {
            const val = filtrosColumna[key].toLowerCase();
            if (val) items = items.filter(item => String((item as any)[key]).toLowerCase().includes(val));
        });
        if (sortKey) {
            items.sort((a: any, b: any) => {
                let vA = a[sortKey] ?? ""; let vB = b[sortKey] ?? "";
                if (sortKey.toLowerCase().includes('fecha')) {
                    const parseDate = (s: string) => { 
                        if(!s) return 0;
                        const [d,m,y] = s.split('/').map(Number); 
                        return new Date(y, m-1, d).getTime(); 
                    };
                    vA = parseDate(vA); vB = parseDate(vB);
                }
                return sortAsc ? (vA < vB ? -1 : 1) : (vA > vB ? -1 : 1);
            });
        }
        return items;
    }, [index, listaCreditos, listaMembresias, searchGlobal, filtrosColumna, sortKey, sortAsc]);

    const itemsPaginados = useMemo(() => {
        return datosFinales.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    }, [datosFinales, page, itemsPerPage]);

    // Anchos constantes para evitar desalineación
    const COL_WIDTH = 140;
    const STATUS_WIDTH = 100;

const HeaderFiltro = ({ title, id }: { title: string, id: string }) => (
        <Menu
            visible={visibleMenu === id}
            onDismiss={() => setVisibleMenu(null)}
            anchor={
                <DataTable.Title 
                    numeric 
                    onPress={() => setVisibleMenu(id)}
                    sortDirection={sortKey === id ? (sortAsc ? 'ascending' : 'descending') : undefined}
                    style={[styles.fixedCell, styles.borderRight]}
                >
                    <Text style={styles.headerLabel}>{title} </Text>
                    <Ionicons name="caret-down" size={10} color={filtrosColumna[id] ? "#007AFF" : "#888"} />
                </DataTable.Title>
            }
        >
            <Menu.Item onPress={() => { setSortKey(id); setSortAsc(true); setVisibleMenu(null); }} title="Ordenar A-Z" leadingIcon="sort-ascending" />
            <Menu.Item onPress={() => { setSortKey(id); setSortAsc(false); setVisibleMenu(null); }} title="Ordenar Z-A" leadingIcon="sort-descending" />
            <Divider />
            <TextInput
                placeholder="Filtrar..."
                value={filtrosColumna[id] || ''}
                onChangeText={(t) => {setFiltrosColumna(prev => ({...prev, [id]: t})); setPage(0);}}
                style={styles.inputMini}
                mode="outlined"
                dense
            />
        </Menu>
    );

    return (
     <PaperProvider>
      <Container style={{ flex: 1 }}>
        <InfoCard>
          <NavRow>
            <IconButton onPress={alternarTab}><Ionicons name="chevron-back" size={24} color="#007AFF" /></IconButton>
            <View style={{ alignItems: 'center' }}>
                <Text style={styles.tabLabel}>{index === 0 ? "CRÉDITOS" : "MEMBRESÍAS"}</Text>
                <Text style={styles.bigCount}>{datosFinales.length} Total</Text>
            </View>
            <IconButton onPress={alternarTab}><Ionicons name="chevron-forward" size={24} color="#007AFF" /></IconButton>
          </NavRow>
        </InfoCard>

        <View style={styles.toolbar}>
            <Menu
                visible={menuPaginationVisible}
                onDismiss={() => setMenuPaginationVisible(false)}
                anchor={
                    <Button mode="outlined" onPress={() => setMenuPaginationVisible(true)} style={styles.btnPage} labelStyle={{fontSize: 12}}>
                        Ver {itemsPerPage}
                    </Button>
                }
            >
                {numberOfItemsPerPageList.map(n => (
                    <Menu.Item key={n} onPress={() => { setItemsPerPage(n); setPage(0); setMenuPaginationVisible(false); }} title={n.toString()} />
                ))}
            </Menu>
            <Searchbar 
                placeholder="Buscar..." 
                onChangeText={setSearchGlobal} 
                value={searchGlobal} 
                style={styles.search} 
                inputStyle={styles.searchTextInput}
            />
        </View>

        <View style={styles.tableWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                {/* Eliminamos el ancho fijo del View/DataTable para que crezca con las columnas */}
                <DataTable style={{ alignSelf: 'flex-start' }}>
                    <DataTable.Header style={styles.headerBg}>
                        {/* Renderizado Condicional de Columnas */}
                        <HeaderFiltro title="Folio" id={index === 0 ? "folioCredito" : "folio"} />
                        <HeaderFiltro title={index === 0 ? "Paquete" : "Tipo"} id={index === 0 ? "paquete" : "tipo"} />
                        <HeaderFiltro title={index === 0 ? "Tipo" : "Inicio"} id={index === 0 ? "tipo" : "fechaInicio"} />
                        <HeaderFiltro title={index === 0 ? "Pago" : "Vence"} id={index === 0 ? "fechaPago" : "fechaFin"} />
                        
                        {/* Aquí puedes agregar más columnas fácilmente */}
                        {index === 0 && <HeaderFiltro title="Expira" id="fechaExpiracion" />}
                        
                        <DataTable.Title numeric style={styles.statusCell}>
                            <Text style={styles.headerLabel}>Estatus</Text>
                        </DataTable.Title>
                    </DataTable.Header>

                    {itemsPaginados.map((item: any) => (
                    <DataTable.Row key={item.id || item.FolioMembresia} style={styles.row}>
                        {/* Folio: Usa FolioMembresia del C# */}
                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                            <Text style={styles.cellText}>
                                {index === 0 ? item.folioCredito : item.FolioMembresia}
                            </Text>
                        </DataTable.Cell>
                        
                        {/* Tipo: Muestra "Mensual", "Semanal", etc. */}
                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                            <Text style={styles.cellText}>
                                {index === 0 ? item.paquete : item.TipoMembresia}
                            </Text>
                        </DataTable.Cell>

                        {/* Fecha Inicio */}
                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                            <Text style={styles.cellText}>
                                {index === 0 ? item.tipo : item.FechaInicio}
                            </Text>
                        </DataTable.Cell>

                        {/* Fecha Vencimiento: Ya viene formateada "dd de MMMM..." */}
                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                            <Text style={styles.cellText}>
                                {index === 0 ? item.fechaPago : item.FechaVencimiento}
                            </Text>
                        </DataTable.Cell>

                        {/* Estatus: Compara el string directo "Activa" */}
                        <DataTable.Cell numeric style={styles.statusCell}>
                            <Text style={{ 
                                color: item.Estatus === "Activa" ? '#2ecc71' : '#e74c3c', 
                                fontWeight: 'bold', 
                                fontSize: 12 
                            }}>
                                {item.Estatus}
                            </Text>
                        </DataTable.Cell>
                    </DataTable.Row>
                ))}
                </DataTable>
            </ScrollView>

            <View style={styles.footer}>
                <DataTable.Pagination
                    page={page}
                    numberOfPages={Math.ceil(datosFinales.length / itemsPerPage)}
                    onPageChange={(p) => setPage(p)}
                    label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, datosFinales.length)} de ${datosFinales.length}`}
                    style={styles.pagination}
                />
            </View>
        </View>
      </Container>
     </PaperProvider>
    );
}

const styles = StyleSheet.create({
    toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10, gap: 10 },
    btnPage: { borderRadius: 8, height: 45, borderColor: '#ccc', justifyContent: 'center' },
    search: { flex: 1, height: 45, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee', justifyContent: 'center' },
    searchTextInput: { fontSize: 14, height: 45, marginTop: -8, textAlignVertical: 'center' }, 
    tabLabel: { fontSize: 12, color: '#7f8c8d', fontWeight: '600' },
    bigCount: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
    tableWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e0e0e0', marginHorizontal: 10, marginBottom: 10 },
    headerBg: { backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', height: 50 },
    headerLabel: { fontWeight: 'bold', color: '#333', fontSize: 13, textAlign: 'center' },
    inputMini: { margin: 10, height: 40, fontSize: 12 },
    row: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', height: 55 },
    cellText: { fontSize: 12, textAlign: 'center' },
    
    // Al usar numeric en el componente, estas propiedades de estilo ahora sí centran el contenido
    fixedCell: { 
        width: 140, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    statusCell: { 
        width: 100, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    borderRight: { borderRightWidth: 1, borderRightColor: '#eee' },
    footer: { borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fbfbfb' },
    pagination: { justifyContent: 'flex-end', height: 50 }
});