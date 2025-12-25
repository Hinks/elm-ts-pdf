import { Template } from "@pdfme/common";

export const todoListTemplate: Template = {
    basePdf: {
        width: 210,
        height: 297,
        padding: [10, 10, 10, 10],
    },
    schemas: [
        [
            {
                name: "title",
                type: "text",
                position: { x: 20, y: 20 },
                width: 170,
                height: 15,
                fontSize: 20,
                fontName: "Helvetica",
                alignment: "center",
                verticalAlignment: "middle",
            },
            {
                name: "todoTable",
                type: "table",
                position: { x: 20, y: 45 },
                width: 170,
                height: 150,
                head: ["ID", "Todo Item", "Status"],
                headWidthPercentages: [12, 59, 29],
                tableStyles: {
                    borderColor: "#000000",
                    borderWidth: 1,
                },
                headStyles: {
                    fontName: "Helvetica",
                    fontSize: 12,
                    fontColor: "#ffffff",
                    backgroundColor: "#2c3e50",
                    alignment: "center",
                    verticalAlignment: "middle",
                    lineHeight: 1.2,
                    characterSpacing: 0,
                    borderColor: "#000000",
                    borderWidth: {
                        top: 1,
                        right: 1,
                        bottom: 1,
                        left: 1,
                    },
                    padding: { top: 5, right: 5, bottom: 5, left: 5 },
                },
                bodyStyles: {
                    fontName: "Helvetica",
                    fontSize: 10,
                    fontColor: "#000000",
                    backgroundColor: "#ffffff",
                    alignment: "left",
                    verticalAlignment: "middle",
                    lineHeight: 1.2,
                    characterSpacing: 0,
                    borderColor: "#000000",
                    borderWidth: {
                        top: 1,
                        right: 1,
                        bottom: 1,
                        left: 1,
                    },
                    padding: { top: 5, right: 5, bottom: 5, left: 5 },
                    alternateBackgroundColor: "#f5f5f5",
                },
                columnStyles: {
                    alignment: {
                        0: "center",
                        1: "left",
                        2: "center",
                    },
                },
                showHead: true,
            },
            {
                name: "todoChart",
                type: "image",
                position: { x: 0, y: 205 },
                width: 210,
                height: 80,
            },
        ],
    ],
};
