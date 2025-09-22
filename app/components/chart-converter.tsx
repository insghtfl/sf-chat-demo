// دالة لتحويل Vega-Lite spec إلى Chart.js data
export function convertVegaLiteToChartJS(spec: Record<string, unknown>): {
    chartData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string | string[];
            borderWidth?: number;
        }[];
    };
    chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'scatter' | 'bubble';
    title?: string;
} {
    const data = (spec?.data as Record<string, unknown>)?.values as Record<string, unknown>[] || [];
    const mark = (spec?.mark as Record<string, unknown>)?.type as string || 'bar';
    const encoding = (spec?.encoding as Record<string, unknown>) || {};
    
    const xField = (encoding.x as Record<string, unknown>)?.field as string;
    const yField = (encoding.y as Record<string, unknown>)?.field as string;
    
    const labels = data.map((item: Record<string, unknown>) => item[xField] as string || '').filter((label: string) => label);
    const values = data.map((item: Record<string, unknown>) => item[yField] as number || 0);
    
    let chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'scatter' | 'bubble' = 'bar';
    if (mark === 'line') chartType = 'line';
    else if (mark === 'arc') chartType = 'doughnut';
    else if (mark === 'point') chartType = 'scatter';
    else if (mark === 'area') chartType = 'line';
    else if (mark === 'circle') chartType = 'scatter';
    
    const title = spec?.title as string || 
                  ((encoding.x as Record<string, unknown>)?.axis as Record<string, unknown>)?.title as string || 
                  ((encoding.y as Record<string, unknown>)?.axis as Record<string, unknown>)?.title as string;
    
    // ألوان افتراضية
    const backgroundColors = [
        'rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(153, 102, 255, 0.2)',
        'rgba(201, 203, 207, 0.2)'
    ];
    
    const borderColors = [
        'rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)',
        'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
    ];
    
    // استخدام ألوان متعددة لجميع الأعمدة
    const backgroundColor = data.map((_: Record<string, unknown>, index: number) => backgroundColors[index % backgroundColors.length]);
    const borderColor = data.map((_: Record<string, unknown>, index: number) => borderColors[index % borderColors.length]);
    
    return {
        chartData: {
            labels,
            datasets: [{
                label: ((encoding.y as Record<string, unknown>)?.axis as Record<string, unknown>)?.title as string || yField || 'القيمة',
                data: values,
                backgroundColor,
                borderColor,
                borderWidth: 2,
            }]
        },
        chartType,
        title
    };
}
