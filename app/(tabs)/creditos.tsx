import { useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { DataTable, Searchbar, PaperProvider, Menu, Divider, TextInput, Button } from 'react-native-paper'; //Libreria de DataTable
import { Container, InfoCard, NavRow, IconButton } from "@/styles/creditosStyle";
import { Ionicons } from "@expo/vector-icons";
import { useAuthService } from "@/servicesdb/authService"; 
import * as schema from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { UserContext } from "@/components/UserContext";

export default function Creditos() {

    const { users, setUsers } = useContext(UserContext);

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

    useFocusEffect(
    useCallback(() => {
        let isMounted = true;

        const cargar = async () => {
    // 1. PRIORIDAD: Usar el gymId que tenemos en el estado GLOBAL (Contexto)
    // Si acabamos de cambiar al 23, 'users.gymId' ya es 23.

    const datosUsuarioGym = await obtenerUsuarioLocal();

    const currentGymId = datosUsuarioGym?.gymId;
    const currentUserId = datosUsuarioGym?.id;

    console.log("Datos api dfg", currentUserId)

    if (currentUserId && currentGymId && isMounted) {
        console.log(`🚀 Sincronizando REAL: Gym ${currentGymId} para Usuario ${currentUserId}`);

        // Limpiamos pantalla para que el usuario vea que algo está pasando
        setListaMembresias([]);
        setListaCreditos([]);

        try {
            // 2. Ejecutar la sincronización (Estas ya no piden Token, lo sacan solas)
            await actualizarBaseDatosLocalMembresia(currentUserId, currentGymId);
            await actualizarBaseDatosLocalCreditos(currentUserId, currentGymId);
            console.log("Datos de creditos xdddd:", users)


            // 3. Traer de SQLite lo que acabamos de insertar
            const resM = await obtenerMembresiasLocal(currentUserId);
            const resC = await obtenerCreditosLocal(currentUserId);

            if (isMounted) {
                // FILTRO DE SEGURIDAD: Solo mostrar lo que coincida con el Gym actual
                const finalM = resM.filter((m: any) => m.gymId === currentGymId);
                const finalC = resC.filter((c: any) => c.gymId === currentGymId);

                setListaMembresias(finalM);
                setListaCreditos(finalC);
                console.log(`✅ Visualizando ${finalC.length} créditos del Gym ${currentGymId}`);
            }
        } catch (err) {
            console.error("Error al sincronizar datos:", err);
        }
        }
    };

        cargar();

        return () => {
            isMounted = false;
        };
        
        // Dependencias: Si users.gymId cambia en el contexto, el efecto se dispara de nuevo
    }, [users?.gymId, users?.token]) 
);


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
                        {/* 1. FOLIO */}
                        <HeaderFiltro 
                            title={index === 0 ? "FOLIO CRÉDITO" : "FOLIO MEMBRESÍA"} 
                            id={index === 0 ? "folioCredito" : "folioMembresia"} 
                        />

                        {/* 2. EXPIRA (Créditos) / TIPO (Membresía) */}
                        <HeaderFiltro 
                            title={index === 0 ? "FECHA EXPIRACIÓN" : "TIPO MEMBRESÍA"} 
                            id={index === 0 ? "fechaExpiracion" : "tipo"} 
                        />

                        {/* 3. PAQUETE (Créditos) / INICIO (Membresía) */}
                        <HeaderFiltro 
                            title={index === 0 ? "PAQUETE" : "FECHA DE INICIO"} 
                            id={index === 0 ? "paquete" : "fechaInicio"} 
                        />

                        {/* 4. PAGO (Créditos) / VENCE (Membresía) */}
                        <HeaderFiltro 
                            title={index === 0 ? "FECHA DE PAGO" : "FECHA DE VENCIMIENTO"} 
                            id={index === 0 ? "fechaPago" : "fechaFin"} 
                        />

                        {/* 5. ESTATUS */}
                        <DataTable.Title numeric style={styles.statusCell}>
                            <Text style={styles.headerLabel}>ESTATUS</Text>
                        </DataTable.Title>

                     
                    </DataTable.Header>

                    {itemsPaginados.map((item: any) => (
                        <DataTable.Row key={item.id || item.folioMembresia || item.folioCredito} style={styles.row}>
                            
                            {/* 1. FOLIO */}
                            <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                                <Text style={styles.cellText}>{index === 0 ? item.folioCredito : item.folioMembresia}</Text>
                            </DataTable.Cell>

                            {/* 2. FECHA EXPIRACIÓN / TIPO MEMBRESÍA */}
                            <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                                <Text style={styles.cellText}>{index === 0 ? item.fechaExpiracion : item.tipo}</Text>
                            </DataTable.Cell>

                            {/* 3. PAQUETE / FECHA INICIO */}
                            <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                                <Text style={styles.cellText}>{index === 0 ? item.paquete : item.fechaInicio}</Text>
                            </DataTable.Cell>

                            {/* 4. FECHA PAGO / FECHA FIN */}
                            <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}>
                                <Text style={styles.cellText}>{index === 0 ? item.fechaPago : item.fechaFin}</Text>
                            </DataTable.Cell>

                            {/* 5. ESTATUS */}
                            <DataTable.Cell numeric style={styles.statusCell}>
                                <Text style={{ 
                                    color: (index === 0 ? item.estatus : item.status) === 1 ? '#2ecc71' : '#e74c3c', 
                                    fontWeight: 'bold', fontSize: 12 
                                }}>
                                    {(index === 0 ? item.estatus : item.status) === 1 ? "ACTIVO" : "VENCIDO"}
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
    cellText: {
        fontSize: 11, // Bajamos un poco el tamaño (estaba en 12)
        textAlign: 'center',
        flexWrap: 'wrap', // Esto permite que el texto baje si no cabe
        lineHeight: 14,   // Espaciado entre líneas si salta
    },    
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