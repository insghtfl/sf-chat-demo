"use client"

import { TopLevelSpec } from "vega-lite";

export function prettifyChartSpec(chartSpec: TopLevelSpec & { width: string | number, height: number }) {
    const newSpec = structuredClone(chartSpec);

    // تحسين الأبعاد
    newSpec.width = 1000;
    newSpec.height = 300; // العودة للحجم السابق

    // إضافة خلفية وتصميم محسن
    newSpec.background = "#ffffff";
    
    // تحسينات شاملة للتصميم
    newSpec.config = {
        // لوحة ألوان محسنة ومتنوعة
        "range": {
            "category": [
                "#1f77b4", // أزرق محترف
                "#ff7f0e", // برتقالي
                "#2ca02c", // أخضر
                "#d62728", // أحمر
                "#9467bd", // بنفسجي
                "#8c564b", // بني
                "#e377c2", // وردي
                "#7f7f7f", // رمادي
                "#bcbd22", // زيتوني
                "#17becf"  // سماوي
            ],
            "diverging": [
                "#d73027", "#f46d43", "#fdae61", 
                "#fee08b", "#ffffbf", "#d9ef8b", 
                "#a6d96a", "#66bd63", "#1a9850"
            ]
        },
        
        // تحسينات المحاور
        "axis": {
            "labelColor": "#2c3e50",
            "titleColor": "#2c3e50",
            "labelFontSize": 12,
            "titleFontSize": 14,
            "labelFontWeight": 500,
            "titleFontWeight": 600,
            "grid": true,
            "gridColor": "#e1e5e9",
            "gridOpacity": 0.3,
            "tickSize": 5,
            "tickColor": "#6c757d",
            "domain": true,
            "domainColor": "#2c3e50",
            "domainWidth": 1
        },
        
        // تحسينات العنوان
        "title": {
            "fontSize": 18,
            "fontWeight": "bold",
            "color": "#2c3e50",
            "font": "Arial, 'Segoe UI', Tahoma, sans-serif",
            "anchor": "start",
            "offset": 20
        },
        
        // تحسينات الأسطورة
        "legend": {
            "labelColor": "#2c3e50",
            "titleColor": "#2c3e50",
            "labelFontSize": 11,
            "titleFontSize": 13,
            "labelFontWeight": 500,
            "titleFontWeight": 600,
            "orient": "right",
            "offset": 10
        },
        
        // تحسينات النصوص
        "text": {
            "fill": "#2c3e50",
            "font": "Arial, 'Segoe UI', Tahoma, sans-serif",
            "fontSize": 12
        },
        
        // تحسينات الخلفية والإطار
        "view": {
            "stroke": "#e1e5e9",
            "strokeWidth": 1,
            "cornerRadius": 8,
            "fill": "#ffffff"
        },
        
        // تحسينات المساحة الداخلية
        "padding": {
            "left": 60,
            "top": 50,
            "right": 40,
            "bottom": 60
        },
        
        // تحسينات الخطوط
        "line": {
            "strokeWidth": 2,
            "strokeCap": "round",
            "strokeJoin": "round"
        },
        
        // تحسينات الأشرطة
        "bar": {
            "cornerRadius": 2,
            "stroke": "transparent",
            "strokeWidth": 0
        },
        
        // تحسينات النقاط
        "point": {
            "filled": true,
            "stroke": "white",
            "strokeWidth": 1
        },
        
        // تحسينات المناطق
        "area": {
            "stroke": "transparent",
            "strokeWidth": 0
        },
        
        // تحسينات القطاعات (Pie Chart)
        "arc": {
            "stroke": "white",
            "strokeWidth": 2
        },
        
        // تحسينات الصندوق (Box Plot)
        "boxplot": {
        },
        
        // تحسينات التلميحات
        "tooltip": {
            "theme": "light",
            "fontSize": 12,
            "font": "Arial, 'Segoe UI', Tahoma, sans-serif",
            "cornerRadius": 6,
            "padding": 8
        },
        
        // تحسينات الحركة والانتقالات
        "transition": {
            "duration": 500,
            "ease": "cubic-in-out"
        },
        
        // تحسينات التكيف مع الشاشة
        "autosize": {
            "type": "fit",
            "contains": "padding"
        },
        
        // تحسينات خاصة باللغة العربية
        "rtl": false, // يمكن تغييرها حسب الحاجة
        
        // تحسينات الألوان المتدرجة
        "gradient": {
            "x1": 0,
            "y1": 0,
            "x2": 0,
            "y2": 1
        }
    };

    // إضافة تحسينات إضافية للرسوم البيانية التفاعلية
    if ('encoding' in newSpec && newSpec.encoding) {
        const encoding = newSpec.encoding as any;
        
        // تحسين التلميحات
        if (encoding.x && encoding.y) {
            encoding.tooltip = [
                { "field": encoding.x.field, "type": encoding.x.type },
                { "field": encoding.y.field, "type": encoding.y.type }
            ];
        }
        
        // تحسين الألوان للرسوم البيانية المتعددة السلاسل
        if (encoding.color && !encoding.color.scale) {
            encoding.color.scale = {
                "scheme": "category20"
            };
        }
    }

    // إضافة تحسينات خاصة لأنواع معينة من الرسوم البيانية
    if ('mark' in newSpec) {
        const mark = newSpec.mark as any;
        const encoding = newSpec.encoding as any;
        
        if (mark === "bar") {
            // تحسين الأشرطة
            if (encoding) {
                encoding.opacity = { "value": 0.8 };
            }
        } else if (mark === "line") {
            // تحسين الخطوط
            if (encoding) {
                encoding.strokeWidth = { "value": 3 };
            }
        } else if (mark === "point") {
            // تحسين النقاط
            if (encoding) {
                encoding.size = { "value": 100 };
            }
        }
    }

    return newSpec;
}