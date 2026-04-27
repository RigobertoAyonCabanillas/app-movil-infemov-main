import { useFocusEffect, useRouter } from "expo-router";
import { useState, useCallback, useMemo, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { DataTable, Searchbar, PaperProvider, Menu, Divider, TextInput, Button, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { Container, InfoCard, NavRow, IconButton } from "@/styles/creditosStyle";
import { Ionicons } from "@expo/vector-icons";
import { useAuthService } from "@/servicesdb/authService"; 
import * as schema from '@/db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { UserContext } from "@/components/UserContext";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BRAND_PINK = '#FF3CAC';
const BRAND_GREEN = '#39FF14';
const BRAND_RED = '#FF3131';

export default function Creditos() {
    const { users } = useContext(UserContext);
    const router = useRouter();

    const [index, setIndex] = useState(0); 
    const [searchGlobal, setSearchGlobal] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10); 
    const [menuPaginationVisible, setMenuPaginationVisible] = useState(false);

    const [filtrosColumna, setFiltrosColumna] = useState<{[key: string]: string}>({});
    const [visibleMenu, setVisibleMenu] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [sortKey, setSortKey] = useState<string | null>(null);

    const { 
        obtenerMembresiasLocal, 
        obtenerCreditosLocal, 
        obtenerUsuarioLocal, 
        actualizarBaseDatosLocalMembresia, 
        actualizarBaseDatosLocalCreditos
    } = useAuthService();

    const [listaMembresias, setListaMembresias] = useState<InferSelectModel<typeof schema.membresiasdb>[]>([]);
    const [listaCreditos, setListaCreditos] = useState<InferSelectModel<typeof schema.creditosdb>[]>([]);

    const alternarTab = () => {     
        setIndex((prev) => (prev === 0 ? 1 : 0));
        setPage(0);
        setFiltrosColumna({});
        setSortKey(null);
        setSearchGlobal('');
        setItemsPerPage(10);
    };

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const cargar = async () => {
                setLoading(true);
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
                    } finally {
                        if (isMounted) setLoading(false);
                    }
                } else {
                    if (isMounted) setLoading(false);
                }
            };
            cargar();
            return () => { isMounted = false; };
        }, [users?.gymId]) 
    );

    const tieneFiltrosActivos = useMemo(() => {
        const hayBusquedaGlobal = searchGlobal.trim().length > 0;
        const hayFiltrosColumna = Object.values(filtrosColumna).some(v => v.trim().length > 0);
        return hayBusquedaGlobal || hayFiltrosColumna;
    }, [searchGlobal, filtrosColumna]);

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
        if (total <= 10) {
            opciones.push(total);
        } else {
            for (let i = 10; i <= Math.min(total, 50); i += 10) {
                opciones.push(i);
            }
            if (total > 50) opciones.push(total);
        }
        return [...new Set(opciones)];
    }, [datosFinales.length]);

    const totalPages = Math.ceil(datosFinales.length / itemsPerPage);

    const itemsPaginados = useMemo(() => {
        const start = page * itemsPerPage;
        return datosFinales.slice(start, start + itemsPerPage);
    }, [datosFinales, page, itemsPerPage]);

    const HeaderFiltro = ({ title, id, showArrow = true }: { title: string, id: string, showArrow?: boolean }) => {
        const content = (
            <DataTable.Title 
                numeric 
                onPress={showArrow ? () => setVisibleMenu(id) : undefined} 
                style={[styles.fixedCell, styles.borderRight]}
            >
                <Text style={styles.headerLabel}>{title}</Text>
                {showArrow && <Ionicons name="caret-down" size={10} color={BRAND_GREEN} style={{marginLeft: 4}} />}
            </DataTable.Title>
        );

        return (
            <Menu
                visible={showArrow && visibleMenu === id}
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
                    activeUnderlineColor={BRAND_PINK}
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
                        <IconButton onPress={alternarTab}><Ionicons name="chevron-back-circle" size={32} color={BRAND_PINK} /></IconButton>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.neonTabLabel}>{index === 0 ? "CRÉDITOS" : "MEMBRESÍAS"}</Text>
                            <Text style={styles.neonBigCount}>{datosFinales.length} Total</Text>
                        </View>
                        <IconButton onPress={alternarTab}><Ionicons name="chevron-forward-circle" size={32} color={BRAND_PINK} /></IconButton>
                    </NavRow>
                </InfoCard>

                <View style={styles.toolbar}>
                    <Menu
                        visible={menuPaginationVisible}
                        onDismiss={() => setMenuPaginationVisible(false)}
                        contentStyle={{ backgroundColor: '#1A1A1A', maxHeight: 250, width: 160 }}
                        anchor={
                            <Button 
                                mode="outlined" 
                                onPress={() => setMenuPaginationVisible(true)} 
                                style={styles.neonBtnPage} 
                                labelStyle={{color: BRAND_PINK, fontSize: 12, fontWeight: 'bold'}}
                            >
                                Ver {itemsPerPage > datosFinales.length ? datosFinales.length : itemsPerPage}
                            </Button>
                        }
                    >
                        <ScrollView showsVerticalScrollIndicator={true}>
                            {opcionesPaginacion.map(n => (
                                <Menu.Item 
                                    key={n} 
                                    titleStyle={{color: '#FFF'}} 
                                    onPress={() => { 
                                        setItemsPerPage(n); 
                                        setPage(0); 
                                        setMenuPaginationVisible(false); 
                                    }} 
                                    title={n === datosFinales.length ? `Ver todos (${n})` : `Ver ${n}`} 
                                />
                            ))}
                        </ScrollView>
                    </Menu>

                    <Searchbar 
                        placeholder="Buscar..." 
                        onChangeText={setSearchGlobal} 
                        value={searchGlobal} 
                        style={styles.neonSearch} 
                        iconColor={BRAND_PINK}
                        placeholderTextColor="#666"
                        inputStyle={{ color: '#FFF', fontSize: 14, paddingVertical: 0, minHeight: 45 }}
                        cursorColor={BRAND_PINK}
                    />
                </View>

                {loading ? (
                    <View style={styles.emptyContainer}><ActivityIndicator color={BRAND_PINK} /></View>
                ) : datosFinales.length > 0 ? (
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
                                                <Text style={[styles.statusText, { color: item.estatus === 1 ? BRAND_GREEN : BRAND_RED }]}>
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
                                onPageChange={(p) => setPage(p)}
                                label={<Text style={{color: BRAND_PINK}}>{`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, datosFinales.length)} de ${datosFinales.length}`}</Text>}
                                showFastPaginationControls
                                numberOfItemsPerPage={itemsPerPage}
                                theme={{ colors: { onSurface: BRAND_PINK } }}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emblemCircle}>
                            <Ionicons name={tieneFiltrosActivos ? "search" : (index === 0 ? "card" : "ribbon")} size={70} color="#222" />
                            <Ionicons name="alert-circle" size={30} color={BRAND_PINK} style={styles.absIcon} />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {tieneFiltrosActivos ? "Sin coincidencias" : `Sin ${index === 0 ? "Créditos" : "Membresías"}`}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {tieneFiltrosActivos 
                                ? "No encontramos ningún resultado que coincida con tu búsqueda." 
                                : "No detectamos planes activos en tu cuenta para esta sucursal."}
                        </Text>
                        
                        {tieneFiltrosActivos ? (
                            <Button 
                                mode="text" 
                                textColor={BRAND_PINK} 
                                onPress={() => { setSearchGlobal(''); setFiltrosColumna({}); }}
                                style={{ marginTop: 10 }}
                            >
                                Limpiar búsqueda
                            </Button>
                        ) : (
                            /* Botón para llevar a la tienda si no hay datos */
                            <Button 
                                mode="contained" 
                                buttonColor={BRAND_PINK} 
                                textColor="#000"
                                labelStyle={{ fontWeight: '900' }}
                                onPress={() => router.push({
                                    pathname: "/tienda",
                                    params: { tipo: index === 0 ? 'C' : 'M' } // Envía 'C' para créditos o 'M' para membresías
                                })} 
                                style={{ marginTop: 25, borderRadius: 10 }}
                            >
                                IR A LA TIENDA
                            </Button>
                        )}
                    </View>
                )}
            </Container>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000', paddingBottom: 10 },
    neonCard: { backgroundColor: '#000', borderWidth: 2, borderColor: BRAND_PINK, borderRadius: 15, margin: 10, elevation: 8, shadowColor: BRAND_PINK, shadowOpacity: 0.5, shadowRadius: 10 },
    neonTabLabel: { fontSize: 13, color: BRAND_PINK, fontWeight: 'bold', letterSpacing: 1.5 },
    neonBigCount: { fontSize: 26, fontWeight: '900', color: '#FFF' },
    toolbar: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, paddingHorizontal: 10, gap: 10 },
    neonBtnPage: { borderColor: BRAND_PINK, borderWidth: 1.5, borderRadius: 10, backgroundColor: '#000', height: 45, justifyContent: 'center', minWidth: 100 },
    neonSearch: { flex: 1, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#333', height: 45, justifyContent: 'center' },
    neonTableWrapper: { flex: 1, backgroundColor: '#000', borderRadius: 15, borderWidth: 2, borderColor: BRAND_GREEN, marginHorizontal: 10, overflow: 'hidden' },
    verticalScrollContainer: { maxHeight: SCREEN_HEIGHT * 0.45 }, 
    neonHeader: { backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: BRAND_GREEN, height: 55 },
    headerLabel: { fontWeight: 'bold', color: BRAND_GREEN, fontSize: 11, textAlign: 'center' },
    neonRow: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A', height: 55 },
    neonCellText: { color: '#FFF', fontSize: 11, textAlign: 'center' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    fixedCell: { width: 120, justifyContent: 'center', alignItems: 'center' },
    statusCell: { width: 90, justifyContent: 'center', alignItems: 'center' },
    borderRight: { borderRightWidth: 1, borderRightColor: '#1A1A1A' },
    neonFooter: { borderTopWidth: 2, borderTopColor: BRAND_GREEN, backgroundColor: '#000', paddingVertical: 5 },
    inputMini: { backgroundColor: '#222', margin: 5, height: 35, fontSize: 12, color: '#FFF' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emblemCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#1A1A1A' },
    absIcon: { position: 'absolute', bottom: 20, right: 20 },
    emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center' }
});