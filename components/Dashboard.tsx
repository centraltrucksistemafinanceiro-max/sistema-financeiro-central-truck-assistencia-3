import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAppData } from '../App';
import { formatCurrency, parseCurrency, MoneyIcon, ClockIcon } from '../constants';

// --- Helper Functions ---
const getToday = () => {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().split('T')[0];
};

const getMonthStart = (date: Date) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1).toISOString().split('T')[0];
const getYearStart = (date: Date) => new Date(date.getUTCFullYear(), 0, 1).toISOString().split('T')[0];

// --- Skeleton Components ---
const CardSkeleton = () => <div className="glass-pane-light p-4 rounded-lg animate-pulse h-[92px]"></div>;
const ChartSkeleton = () => <div className="glass-pane-light p-4 rounded-lg animate-pulse h-full"></div>;

// --- Tooltip Component ---
interface TooltipData {
    x: number;
    y: number;
    content: string;
    visible: boolean;
}
const Tooltip: React.FC<{ tooltip: TooltipData }> = ({ tooltip }) => {
    if (!tooltip.visible) return null;
    return (
        <div className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full glass-pane text-xs p-2 rounded-md shadow-lg z-10"
             style={{ left: tooltip.x, top: tooltip.y, transition: 'top 0.2s, left 0.2s' }}>
            <div dangerouslySetInnerHTML={{ __html: tooltip.content }} />
        </div>
    );
};


// --- Chart Components ---
const PieChart = ({ data, title }: { data: { labels: string[], series: number[], colors: string[] }, title: string }) => {
    const total = data.series.reduce((a, b) => a + b, 0);

    return (
        <div className="glass-pane p-4 rounded-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">{title}</h3>
            {total === 0 ? (
                 <div className="flex-grow flex items-center justify-center text-slate-400">Sem dados para exibir</div>
            ) : (
                <div className="flex-grow flex items-center justify-center gap-8 flex-wrap">
                    <svg viewBox="0 0 100 100" className="w-40 h-40 transform-gpu -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#475569" strokeWidth="15" />
                        {data.series.map((value, index, arr) => {
                            const circumference = 2 * Math.PI * 40;
                            const offset = arr.slice(0, index).reduce((acc, val) => acc + (val / total) * circumference, 0);
                            const dasharray = `${(value / total) * circumference} ${circumference}`;
                            return (
                                <circle key={index} cx="50" cy="50" r="40" fill="transparent"
                                    stroke={data.colors[index]} strokeWidth="15" strokeDasharray={dasharray}
                                    strokeDashoffset={-offset} className="transition-all duration-500" />
                            );
                        })}
                    </svg>
                    <div className="flex flex-col gap-2 text-sm text-slate-300">
                        {data.labels.map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.colors[i] }}></div>
                                <span>{label}: <strong>{formatCurrency(data.series[i])}</strong> ({total > 0 ? (data.series[i] / total * 100).toFixed(1) : 0}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LineChart = ({ data, title }: { data: { labels: string[], series: { name: string, data: number[], color: string }[] }, title: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, content: '', visible: false });
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const allValues = data.series.flatMap(s => s.data);
    const hasData = allValues.some(v => v > 0);

    const margin = { top: 20, right: 20, bottom: 30, left: 70 };
    const { width, height } = dimensions;
    const chartWidth = Math.max(0, width - margin.left - margin.right);
    const chartHeight = Math.max(0, height - margin.top - margin.bottom);

    const getNiceScale = (maxValue: number) => {
        if (!isFinite(maxValue) || maxValue <= 0) return { ticks: [0, 25, 50, 75, 100], max: 100 };
        const numTicks = 5;
        const exponent = Math.floor(Math.log10(maxValue));
        const powerOf10 = Math.pow(10, exponent);
        const niceFractions = [1, 2, 5, 10];
        
        const roughTickSize = maxValue / (numTicks - 1);
        const normalizedTickSize = roughTickSize / powerOf10;
        
        let niceTickSize = niceFractions.find(f => f >= normalizedTickSize) * powerOf10;
        if (!isFinite(niceTickSize)) niceTickSize = 10 * powerOf10;

        const max = Math.ceil(maxValue / niceTickSize) * niceTickSize;
        const ticks = Array.from({ length: Math.round(max / niceTickSize) + 1 }, (_, i) => i * niceTickSize);
        return { ticks, max };
    };
    
    const { ticks: yTicks, max: maxY } = getNiceScale(Math.max(...allValues, 0));

    const y = (val: number) => chartHeight - (val / maxY) * chartHeight;
    const x = (index: number) => data.labels.length > 1 ? (index / (data.labels.length - 1)) * chartWidth : chartWidth / 2;
    
    const formatAxisLabel = (value: number) => {
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
        return `R$ ${value}`;
    };

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        if (!svgRef.current || !hasData || chartWidth <= 0) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - margin.left;
        const index = Math.max(0, Math.min(data.labels.length - 1, Math.round((mouseX / chartWidth) * (data.labels.length - 1))));

        if (index >= 0 && index < data.labels.length) {
            setActiveIndex(index);
            const content = `<strong>${data.labels[index]}</strong><br/>` + data.series.map(s =>
                `<div style="display: flex; align-items: center; gap: 4px;"><div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${s.color};"></div>${s.name}: ${formatCurrency(s.data[index])}</div>`
            ).join('');

            setTooltip({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10,
                content,
                visible: true,
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltip(t => ({ ...t, visible: false }));
        setActiveIndex(null);
    };

    return (
        <div ref={containerRef} className="glass-pane p-4 rounded-lg h-full flex flex-col relative">
             <Tooltip tooltip={tooltip} />
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
                <div className="flex items-center gap-4 text-xs">
                    {data.series.map((s, i) => (
                        <div key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div><span>{s.name}</span></div>
                    ))}
                </div>
            </div>
            {!hasData ? (
                <div className="flex-grow flex items-center justify-center text-slate-400">Sem dados para exibir</div>
            ) : (
                <div className="flex-grow min-h-0">
                    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                        {chartWidth > 0 && chartHeight > 0 && (
                            <g transform={`translate(${margin.left}, ${margin.top})`}>
                                {/* Y Axis and Grid */}
                                {yTicks.map((tick, i) => (
                                    <g key={i} transform={`translate(0, ${y(tick)})`} className="text-slate-500">
                                        <line x1={0} y1="0" x2={chartWidth} y2="0" stroke="currentColor" strokeDasharray="2,3" />
                                        <text x="-10" y="0" dy="0.32em" textAnchor="end" fill="#94a3b8" fontSize="10">
                                            {formatAxisLabel(tick)}
                                        </text>
                                    </g>
                                ))}
                                {/* X Axis */}
                                {data.labels.map((label, i) => (
                                    <text key={i} x={x(i)} y={chartHeight + 20} textAnchor="middle" fill="#94a3b8" fontSize="10">
                                        {label}
                                    </text>
                                ))}
                                
                                {/* Data series */}
                                {data.series.map((s, seriesIndex) => {
                                    const linePath = "M" + s.data.map((val, i) => `${x(i)},${y(val)}`).join(" L");
                                    const areaPath = linePath + ` L${x(s.data.length - 1)},${chartHeight} L${x(0)},${chartHeight} Z`;

                                    return (
                                    <g key={seriesIndex}>
                                        {/* Area */}
                                        <defs>
                                            <linearGradient id={`gradient-${seriesIndex}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={s.color} stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <path d={areaPath} fill={`url(#gradient-${seriesIndex})`} />
                                        {/* Line */}
                                        <path d={linePath} fill="none" stroke={s.color} strokeWidth="2" />
                                        {/* Points */}
                                        {s.data.map((val, i) => (
                                            <circle key={i} cx={x(i)} cy={y(val)} r={activeIndex === i ? 5 : 3} fill={s.color} stroke="#1e293b" strokeWidth="2" className="transition-all" />
                                        ))}
                                    </g>
                                )})}

                                {/* Interaction layer */}
                                {activeIndex !== null && (
                                    <line 
                                        x1={x(activeIndex)} 
                                        y1="0" 
                                        x2={x(activeIndex)} 
                                        y2={chartHeight} 
                                        stroke="#94a3b8" 
                                        strokeWidth="1" 
                                        strokeDasharray="3,3"
                                    />
                                )}
                                <rect 
                                    width={chartWidth} 
                                    height={chartHeight} 
                                    fill="transparent" 
                                    onMouseMove={handleMouseMove} 
                                    onMouseLeave={handleMouseLeave} 
                                />
                            </g>
                        )}
                    </svg>
                </div>
            )}
        </div>
    );
};


const BarChart = ({ data, title }: { data: { labels: string[], series: number[] }, title: string }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, content: '', visible: false });

    if (data.series.length === 0) {
        return (
            <div className="glass-pane p-4 rounded-lg h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">{title}</h3>
                <div className="flex-grow flex items-center justify-center text-slate-400">Sem despesas no período</div>
            </div>
        )
    }

    const maxValue = Math.max(...data.series, 0) || 1;
    
    const handleMouseOver = (e: React.MouseEvent, index: number) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const chartRect = chartRef.current!.getBoundingClientRect();
        setTooltip({
            x: rect.left - chartRect.left + rect.width / 2,
            y: rect.top - chartRect.top,
            content: `<strong>${data.labels[index]}</strong>: ${formatCurrency(data.series[index])}`,
            visible: true
        });
    };

    return (
        <div className="glass-pane p-4 rounded-lg h-full flex flex-col relative" ref={chartRef}>
            <Tooltip tooltip={tooltip} />
            <h3 className="text-lg font-semibold mb-4 text-slate-200">{title}</h3>
            <div className="flex-grow flex flex-col justify-around gap-2" onMouseLeave={() => setTooltip(t => ({...t, visible: false}))}>
                {data.series.map((value, index) => (
                    <div key={index} className="flex items-center gap-3 text-xs">
                        <span className="w-28 text-right truncate text-slate-300">{data.labels[index]}</span>
                        <div className="flex-grow bg-slate-700 h-6 rounded overflow-hidden">
                           <div className="bg-blue-500 h-full rounded transition-all duration-500" style={{ width: `${(value / maxValue) * 100}%` }} onMouseOver={(e) => handleMouseOver(e, index)}></div>
                        </div>
                        <span className="font-semibold w-24">{formatCurrency(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { data, loading } = useAppData();
    const [startDate, setStartDate] = useState(() => getMonthStart(new Date()));
    const [endDate, setEndDate] = useState(() => getToday());
    const [activeFilter, setActiveFilter] = useState('Este Mês');

    const handleFilterClick = (filter: string) => {
        const today = new Date();
        setActiveFilter(filter);
        switch (filter) {
            case 'Este Mês':
                setStartDate(getMonthStart(today));
                setEndDate(getToday());
                break;
            case 'Este Ano':
                setStartDate(getYearStart(today));
                setEndDate(getToday());
                break;
            default:
                setStartDate('');
                setEndDate('');
                break;
        }
    };

    const filteredData = useMemo(() => {
        const filterByDate = <T extends { [key: string]: any }>(items: T[], dateField: keyof T): T[] => {
            if (!startDate && !endDate) return items;
            return items.filter(item => {
                const itemDate = (item[dateField] as string)?.split('T')[0];
                if (!itemDate) return false;
                const isAfterStart = !startDate || itemDate >= startDate;
                const isBeforeEnd = !endDate || itemDate <= endDate;
                return isAfterStart && isBeforeEnd;
            });
        };
        return {
            contasPagar: filterByDate(data.contasPagar, 'vencimento'),
            fluxoCaixa: filterByDate(data.fluxoCaixa, 'data_movimento'),
            faturamentoComNF: filterByDate(data.faturamentoComNF, 'data_faturamento'),
            faturamentoSemNF: filterByDate(data.faturamentoSemNF, 'data_faturamento'),
        };
    }, [data, startDate, endDate]);

    const faturamentoComNFPeriodo = useMemo(() => filteredData.faturamentoComNF.reduce((sum, item) => sum + parseCurrency(item.valor_total), 0), [filteredData.faturamentoComNF]);
    
    const faturamentoSemNFPeriodo = useMemo(() => {
        const revenueCategories = ['FATURAMENTO', 'CENTRAL TRUCK'];
        const deductionCategories = ['GARANTIA', 'CORTESIA', 'INTERNO', 'RETORNO'];
        return filteredData.faturamentoSemNF.reduce((sum, item) => {
            const value = parseCurrency(item.valor_total);
            if (revenueCategories.includes(item.categoria)) return sum + value;
            if (deductionCategories.includes(item.categoria)) return sum - value;
            return sum;
        }, 0);
    }, [filteredData.faturamentoSemNF]);

    const faturamentoTotal = faturamentoComNFPeriodo + faturamentoSemNFPeriodo;
    const balancoCaixa = useMemo(() => filteredData.fluxoCaixa.reduce((sum, item) => sum + (item.tipo_movimento === 'ENTRADA' ? parseCurrency(item.valor) : -parseCurrency(item.valor)), 0), [filteredData.fluxoCaixa]);
    const contasPagarTotal = useMemo(() => filteredData.contasPagar.reduce((sum, item) => sum + parseCurrency(item.valor_com_nota) + parseCurrency(item.valor_sem_nota), 0), [filteredData.contasPagar]);
    const contasVencidasTotal = useMemo(() => data.contasPagar.filter(c => c.status === 'PENDENTE' && c.vencimento < getToday()).reduce((sum, item) => sum + parseCurrency(item.valor_com_nota) + parseCurrency(item.valor_sem_nota), 0), [data.contasPagar]);
    const contasPendentesPeriodo = useMemo(() => filteredData.contasPagar.filter(c => c.status === 'PENDENTE').reduce((sum, item) => sum + parseCurrency(item.valor_com_nota) + parseCurrency(item.valor_sem_nota), 0), [filteredData.contasPagar]);
    const lucroPrevisto = faturamentoTotal - contasPagarTotal;

    const composicaoFaturamentoData = useMemo(() => ({
        labels: ['Faturamento C/ NF', 'Faturamento S/ NF (Líquido)'],
        series: [faturamentoComNFPeriodo, Math.max(0, faturamentoSemNFPeriodo)],
        colors: ['#3b82f6', '#10b981']
    }), [faturamentoComNFPeriodo, faturamentoSemNFPeriodo]);

    const top5DespesasData = useMemo(() => {
        const despesasPorCategoria = filteredData.contasPagar.reduce((acc, item) => {
            const total = parseCurrency(item.valor_com_nota) + parseCurrency(item.valor_sem_nota);
            acc[item.categoria] = (acc[item.categoria] || 0) + total;
            return acc;
        }, {} as Record<string, number>);
        // FIX: Explicitly cast values to number in sort to fix TypeScript error.
        const sorted = Object.entries(despesasPorCategoria).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5);
        return {
            labels: sorted.map(([label]) => label),
            series: sorted.map(([, value]) => value),
        };
    }, [filteredData.contasPagar]);
    
    const evolucaoFaturamentoData = useMemo(() => {
        const year = new Date().getUTCFullYear();
        const months = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(year, i, 1)).toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase());
        const seriesComNF = Array(12).fill(0);
        const seriesSemNF = Array(12).fill(0);
        const revenueCategories = ['FATURAMENTO', 'CENTRAL TRUCK'];
        const deductionCategories = ['GARANTIA', 'CORTESIA', 'INTERNO', 'RETORNO'];

        data.faturamentoComNF.forEach(item => {
            const d = new Date(item.data_faturamento);
            if (d.getUTCFullYear() === year) {
                seriesComNF[d.getUTCMonth()] += parseCurrency(item.valor_total);
            }
        });
        
        data.faturamentoSemNF.forEach(item => {
            const d = new Date(item.data_faturamento);
            if (d.getUTCFullYear() === year) {
                const value = parseCurrency(item.valor_total);
                if (revenueCategories.includes(item.categoria)) seriesSemNF[d.getUTCMonth()] += value;
                else if (deductionCategories.includes(item.categoria)) seriesSemNF[d.getUTCMonth()] -= value;
            }
        });

        return {
            labels: months,
            series: [
                { name: 'Faturamento c/ NF', data: seriesComNF, color: '#3b82f6' },
                { name: 'Faturamento s/ NF (Líquido)', data: seriesSemNF, color: '#10b981' }
            ]
        };
    }, [data.faturamentoComNF, data.faturamentoSemNF]);

    const kpis = [
        { title: 'Faturamento Total', value: faturamentoTotal, icon: MoneyIcon, color: 'text-green-400' },
        { title: 'Balanço do Caixa', value: balancoCaixa, icon: MoneyIcon, color: balancoCaixa >= 0 ? 'text-green-400' : 'text-red-400' },
        { title: 'Total Contas a Pagar', value: contasPagarTotal, icon: MoneyIcon, color: 'text-yellow-400' },
        { title: 'Total Contas Vencidas', value: contasVencidasTotal, icon: ClockIcon, color: 'text-red-400' },
        { title: 'Contas Pendentes', value: contasPendentesPeriodo, icon: ClockIcon, color: 'text-yellow-400' },
        { title: 'Lucro Previsto', value: lucroPrevisto, icon: MoneyIcon, color: lucroPrevisto >= 0 ? 'text-green-400' : 'text-red-400' },
    ];

    return (
        <div className="text-white flex flex-col h-full gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => handleFilterClick('Este Mês')} className={`btn-secondary text-xs ${activeFilter === 'Este Mês' ? '!bg-blue-600' : ''}`}>Este Mês</button>
                <button onClick={() => handleFilterClick('Este Ano')} className={`btn-secondary text-xs ${activeFilter === 'Este Ano' ? '!bg-blue-600' : ''}`}>Este Ano</button>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActiveFilter('custom'); }} className="input-style text-xs" title="Data de início" />
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActiveFilter('custom'); }} className="input-style text-xs" title="Data de fim" />
                <button onClick={() => handleFilterClick('Tudo')} className={`btn-secondary text-xs ${activeFilter === 'Tudo' ? '!bg-blue-600' : ''}`}>Limpar Filtros</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {loading ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />) :
                    kpis.map(kpi => {
                        const Icon = kpi.icon;
                        return (
                            <div key={kpi.title} className="glass-pane-light p-4 rounded-lg flex items-center gap-4">
                                <Icon className={`h-8 w-8 ${kpi.color}`} />
                                <div>
                                    <h3 className="text-sm text-slate-400 font-bold whitespace-nowrap">{kpi.title}</h3>
                                    <p className={`text-2xl font-bold ${kpi.color}`}>{formatCurrency(kpi.value)}</p>
                                </div>
                            </div>
                        )
                    })
                }
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow min-h-0">
                <div className="lg:col-span-2 min-h-[350px]">
                    {loading ? <ChartSkeleton /> : <LineChart data={evolucaoFaturamentoData} title={`Evolução do Faturamento Mensal (${new Date().getFullYear()})`} />}
                </div>
                <div className="lg:col-span-1 min-h-[350px]">
                     {loading ? <ChartSkeleton /> : <PieChart data={composicaoFaturamentoData} title="Composição do Faturamento" />}
                </div>
                <div className="lg:col-span-3 min-h-[350px]">
                   {loading ? <ChartSkeleton /> : <BarChart data={top5DespesasData} title="Top 5 Despesas por Categoria" />}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;