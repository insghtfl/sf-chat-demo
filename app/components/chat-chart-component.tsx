import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    ArcElement, 
    PointElement, 
    LineElement,
    RadialLinearScale,
    Filler,
    TimeScale,
    TimeSeriesScale,
    LogarithmicScale
} from 'chart.js';
import { 
    Bar, 
    Line, 
    Pie, 
    Doughnut, 
    PolarArea, 
    Radar, 
    Scatter,
    Bubble
} from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    TimeScale,
    TimeSeriesScale,
    LogarithmicScale
);

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'scatter' | 'bubble';

export interface ChatChartComponentProps {
    chartData: {
        labels?: string[];
        datasets: {
            label: string;
            data: number[] | { x: number; y: number }[] | { x: number; y: number; r: number }[];
            backgroundColor?: string | string[];
            borderColor?: string | string[];
            borderWidth?: number;
            fill?: boolean;
            tension?: number;
            pointRadius?: number;
            pointHoverRadius?: number;
            pointBackgroundColor?: string | string[];
            pointBorderColor?: string | string[];
            pointBorderWidth?: number;
            pointHoverBackgroundColor?: string | string[];
            pointHoverBorderColor?: string | string[];
            pointHoverBorderWidth?: number;
            pointStyle?: string | string[];
            showLine?: boolean;
            spanGaps?: boolean;
            stepped?: boolean | string;
            borderDash?: number[];
            borderDashOffset?: number;
            borderCapStyle?: string;
            borderJoinStyle?: string;
            cubicInterpolationMode?: string;
            clip?: boolean | object;
            order?: number;
            stack?: string;
            normalized?: boolean;
            hidden?: boolean;
        }[];
    };
    chartType?: ChartType;
    title?: string;
}

// دالة للحصول على scales المناسبة لكل نوع رسم بياني
function getScalesForChartType(chartType: ChartType) {
    if (chartType === 'bar' || chartType === 'line') {
        return {
            x: {
                grid: {
                    display: true,
                    color: '#E5E7EB',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 8
                }
            },
            y: {
                grid: {
                    display: true,
                    color: '#E5E7EB',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 8
                }
            }
        };
    }
    
    if (chartType === 'pie' || chartType === 'doughnut') {
        return undefined; // لا تحتاج scales
    }
    
    if (chartType === 'scatter' || chartType === 'bubble') {
        return {
            x: {
                type: 'linear',
                grid: {
                    display: true,
                    color: '#E5E7EB',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 8
                }
            },
            y: {
                type: 'linear',
                grid: {
                    display: true,
                    color: '#E5E7EB',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 8
                }
            }
        };
    }
    
    if (chartType === 'radar') {
        return {
            r: {
                grid: {
                    display: true,
                    color: '#E5E7EB',
                    lineWidth: 1
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 8
                }
            }
        };
    }
    
    return undefined;
}

export function ChatChartComponent(props: Readonly<ChatChartComponentProps>) {
    const { chartData, chartType = 'bar', title } = props;

    // Error handling
    if (!chartData?.datasets) {
        return (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
                <span className="font-semibold">خطأ: بيانات الرسم البياني غير صحيحة</span>
                </div>
        );
    }

    // Default options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: chartType === 'doughnut' ? '50%' : undefined,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 25,
                    color: '#25935f',
                    font: {
                        size: 14,
                        weight: '500'
                    }
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#25935f',
                padding: 25,
                font: {
                    size: 18,
                    weight: '600'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#E5E7EB',
                bodyColor: '#F9FAFB',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                padding: 16,
                titleFont: {
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    size: 13,
                    weight: '500'
                }
            }
        },
        scales: getScalesForChartType(chartType),
        elements: {
            bar: {
                borderRadius: 8,
                borderSkipped: false,
            },
            line: {
                tension: 0.4,
            },
            point: {
                radius: 6,
                hoverRadius: 8,
            },
            arc: {
                borderWidth: 2,
                borderAlign: 'center',
            }
        }
    };

    // Render chart
    const renderChart = () => {
        const commonProps = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: chartData as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: options as any
        };

        switch (chartType) {
            case 'line':
                return <Line {...commonProps} />;
            case 'pie':
                return <Pie {...commonProps} />;
            case 'doughnut':
                return <Doughnut {...commonProps} />;
            case 'polarArea':
                return <PolarArea {...commonProps} />;
            case 'radar':
                return <Radar {...commonProps} />;
            case 'scatter':
                return <Scatter {...commonProps} />;
            case 'bubble':
                return <Bubble {...commonProps} />;
            case 'bar':
            default:
                return <Bar {...commonProps} />;
        }
    };

    return (
        <div className="w-full">
            <div className="h-80 w-full">
                {renderChart()}
            </div>
        </div>
    )
}