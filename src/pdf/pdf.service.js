import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const generatePDF = async (html) => {
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
    });

    await browser.close();

    return pdf;
};