import { useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { DataTable, Searchbar, PaperProvider, Menu, Divider, TextInput, Button, MD3DarkTheme } from 'react-native-paper';
import { Container, InfoCard, NavRow, IconButton } from "@/styles/creditosStyle";
import { Ionicons } from "@expo/vector-icons";
import { useAuthService } from "@/servicesdb/authService"; 
import * as schema from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { UserContext } from "@/components/UserContext";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Creditos() {
    const { users } = useContext(UserContext);

    const [index, setIndex] = useState(0); 
    const [searchGlobal, setSearchGlobal] = useState('');
    
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10); 
    const [menuPaginationVisible, setMenuPaginationVisible] = useState(false);

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
        setSortKey(null);
    };

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const cargar = async () => {
                const datosUsuarioGym = await obtenerUsuarioLocal();
                const currentGymId = datosUsuarioGym?.gymId;
                const currentUserId = datosUsuarioGym?.id;

                if (currentUserId && currentGymId && isMounted) {
                    try {
                        await actualizarBaseDatosLocalMembresia(currentUserId, currentGymId);
                        await actualizarBaseDatosLocalCreditos(currentUserId, currentGymId);
                        const resM = await obtenerMembresiasLocal(currentUserId);
                        const resC = await obtenerCreditosLocal(currentUserId);

                        if (isMounted) {
                            setListaMembresias(resM.filter((m: any) => m.gymId === currentGymId));
                            setListaCreditos(resC.filter((c: any) => c.gymId === currentGymId));
                        }
                    } catch (err) {
                        console.error("Error al sincronizar datos:", err);
                    }
                }
            };
            cargar();
            return () => { isMounted = false; };
        }, [users?.gymId]) 
    );

    type FilaTabla = typeof listaCreditos[0] | typeof listaMembresias[0];
    
    const datosFinales = useMemo(() => {
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

    const opcionesPaginacion = useMemo(() => {
        const total = datosFinales.length;
        if (total === 0) return [10];
        const opciones = [];
        for (let i = 10; i < total; i += 10) { opciones.push(i); }
        opciones.push(total);
        return opciones;
    }, [datosFinales.length]);

    const totalPages = Math.ceil(datosFinales.length / itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) { setPage(newPage); }
    };

    const itemsPaginados = useMemo(() => {
        const start = page * itemsPerPage;
        return datosFinales.slice(start, start + itemsPerPage);
    }, [datosFinales, page, itemsPerPage]);

    // COMPONENTE CORREGIDO: No borra el encabezado, solo desactiva la interacción y oculta la flecha
    const HeaderFiltro = ({ title, id, showArrow = true }: { title: string, id: string, showArrow?: boolean }) => {
        const content = (
            <DataTable.Title 
                numeric 
                onPress={showArrow ? () => setVisibleMenu(id) : undefined} 
                style={[styles.fixedCell, styles.borderRight]}
            >
                <Text style={styles.headerLabel}>{title}</Text>
                {showArrow && <Ionicons name="caret-down" size={10} color="#00E5FF" style={{marginLeft: 4}} />}
            </DataTable.Title>
        );

        return (
            <Menu
                visible={showArrow && visibleMenu === id} // Solo se muestra si showArrow es true
                onDismiss={() => setVisibleMenu(null)}
                contentStyle={{ backgroundColor: '#1A1A1A', minWidth: 150 }}
                anchor={content}
            >
                <Menu.Item titleStyle={{color: '#FFF'}} onPress={() => { setSortKey(id); setSortAsc(true); setVisibleMenu(null); }} title="Ordenar A-Z" leadingIcon="sort-ascending" />
                <Menu.Item titleStyle={{color: '#FFF'}} onPress={() => { setSortKey(id); setSortAsc(false); setVisibleMenu(null); }} title="Ordenar Z-A" leadingIcon="sort-descending" />
                <Divider style={{backgroundColor: '#333'}} />
                <TextInput
                    placeholder="Filtrar..."
                    placeholderTextColor="#666"
                    value={filtrosColumna[id] || ''}
                    onChangeText={(t) => {setFiltrosColumna(prev => ({...prev, [id]: t})); setPage(0);}}
                    style={styles.inputMini}
                    textColor="#FFF"
                    dense
                    underlineColor="transparent"
                />
            </Menu>
        );
    };

    return (
        <PaperProvider theme={MD3DarkTheme}>
            <Container style={styles.mainContainer}>
                <InfoCard style={styles.neonCard}>
                    <NavRow>
                        <IconButton onPress={alternarTab}><Ionicons name="chevron-back-circle" size={32} color="#00E5FF" /></IconButton>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.neonTabLabel}>{index === 0 ? "CRÉDITOS" : "MEMBRESÍAS"}</Text>
                            <Text style={styles.neonBigCount}>{datosFinales.length} Total</Text>
                        </View>
                        <IconButton onPress={alternarTab}><Ionicons name="chevron-forward-circle" size={32} color="#00E5FF" /></IconButton>
                    </NavRow>
                </InfoCard>

                <View style={styles.toolbar}>
                    <Menu
                        visible={menuPaginationVisible}
                        onDismiss={() => setMenuPaginationVisible(false)}
                        contentStyle={{ backgroundColor: '#1A1A1A' }}
                        anchor={
                            <Button mode="outlined" onPress={() => setMenuPaginationVisible(true)} style={styles.neonBtnPage} labelStyle={{color: '#00E5FF', fontSize: 12, fontWeight: 'bold'}}>
                                Ver {itemsPerPage > datosFinales.length ? datosFinales.length : itemsPerPage}
                            </Button>
                        }
                    >
                        {opcionesPaginacion.map(n => (
                            <Menu.Item 
                                key={n} 
                                titleStyle={{color: '#FFF'}} 
                                onPress={() => { setItemsPerPage(n); setPage(0); setMenuPaginationVisible(false); }} 
                                title={n === datosFinales.length ? `Ver todos (${n})` : `Ver ${n}`} 
                            />
                        ))}
                    </Menu>

                    <Searchbar 
                        placeholder="Buscar..." 
                        onChangeText={setSearchGlobal} 
                        value={searchGlobal} 
                        style={styles.neonSearch} 
                        iconColor="#00E5FF"
                        placeholderTextColor="#666"
                        inputStyle={{ color: '#FFF', fontSize: 14, paddingVertical: 0, minHeight: 45 }}
                        cursorColor="#00E5FF"
                    />
                </View>

                <View style={styles.neonTableWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <View>
                            <DataTable.Header style={styles.neonHeader}>
                                <HeaderFiltro title="FOLIO" id={index === 0 ? "folioCredito" : "folioMembresia"} showArrow={false} />
                                <HeaderFiltro title={index === 0 ? "EXPIRACIÓN" : "TIPO"} id={index === 0 ? "fechaExpiracion" : "tipo"} showArrow={false} />
                                <HeaderFiltro title={index === 0 ? "PAQUETE" : "INICIO"} id={index === 0 ? "paquete" : "fechaInicio"} showArrow={false} />
                                <HeaderFiltro title={index === 0 ? "PAGO" : "VENCIMIENTO"} id={index === 0 ? "fechaPago" : "fechaFin"} showArrow={false} />
                                
                                <DataTable.Title numeric style={styles.statusCell}>
                                    <Text style={styles.headerLabel}>ESTATUS</Text>
                                </DataTable.Title>
                            </DataTable.Header>

                            <ScrollView style={styles.verticalScrollContainer}>
                                {itemsPaginados.map((item: any, idx) => (
                                    <DataTable.Row key={item.id || idx} style={styles.neonRow}>
                                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}><Text style={styles.neonCellText}>{index === 0 ? item.folioCredito : item.folioMembresia}</Text></DataTable.Cell>
                                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}><Text style={styles.neonCellText}>{index === 0 ? item.fechaExpiracion : item.tipo}</Text></DataTable.Cell>
                                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}><Text style={styles.neonCellText}>{index === 0 ? item.paquete : item.fechaInicio}</Text></DataTable.Cell>
                                        <DataTable.Cell numeric style={[styles.fixedCell, styles.borderRight]}><Text style={styles.neonCellText}>{index === 0 ? item.fechaPago : item.fechaFin}</Text></DataTable.Cell>
                                        <DataTable.Cell numeric style={styles.statusCell}>
                                            <Text style={[styles.statusText, { color: item.estatus === 1 ? '#00FF41' : '#FF3131' }]}>
                                                {item.estatus === 1 ? "ACTIVO" : "VENCIDO"}
                                            </Text>
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    <View style={styles.neonFooter}>
                        <DataTable.Pagination
                            page={page}
                            numberOfPages={totalPages}
                            onPageChange={handlePageChange}
                            label={<Text style={{color: '#00E5FF'}}>{`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, datosFinales.length)} de ${datosFinales.length}`}</Text>}
                            showFastPaginationControls
                            numberOfItemsPerPage={itemsPerPage}
                            theme={{ colors: { onSurface: '#00E5FF' } }}
                        />
                    </View>
                </View>
            </Container>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000', paddingBottom: 10 },
    neonCard: { backgroundColor: '#000', borderWidth: 2, borderColor: '#00E5FF', borderRadius: 15, margin: 10, elevation: 8, shadowColor: '#00E5FF', shadowOpacity: 0.5, shadowRadius: 10 },
    neonTabLabel: { fontSize: 13, color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1.5 },
    neonBigCount: { fontSize: 26, fontWeight: '900', color: '#FFF' },
    toolbar: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, paddingHorizontal: 10, gap: 10 },
    neonBtnPage: { borderColor: '#00E5FF', borderWidth: 1.5, borderRadius: 10, backgroundColor: '#000', height: 45, justifyContent: 'center', minWidth: 90 },
    neonSearch: { flex: 1, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#333', height: 45, justifyContent: 'center',},
    neonTableWrapper: { flex: 1, backgroundColor: '#000', borderRadius: 15, borderWidth: 2, borderColor: '#00E5FF', marginHorizontal: 10, overflow: 'hidden' },
    verticalScrollContainer: { maxHeight: SCREEN_HEIGHT * 0.45 }, 
    neonHeader: { backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#00E5FF', height: 55 },
    headerLabel: { fontWeight: 'bold', color: '#00E5FF', fontSize: 11, textAlign: 'center' },
    neonRow: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A', height: 55 },
    neonCellText: { color: '#FFF', fontSize: 11, textAlign: 'center' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    fixedCell: { width: 120, justifyContent: 'center', alignItems: 'center' },
    statusCell: { width: 90, justifyContent: 'center', alignItems: 'center' },
    borderRight: { borderRightWidth: 1, borderRightColor: '#1A1A1A' },
    neonFooter: { borderTopWidth: 2, borderTopColor: '#00E5FF', backgroundColor: '#000', paddingVertical: 5 },
    inputMini: { backgroundColor: '#222', margin: 5, height: 35, fontSize: 12, color: '#FFF' }
});