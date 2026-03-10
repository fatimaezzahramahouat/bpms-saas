import { jsPDF } from "jspdf";
import path from "path";
import fs from "fs";
import prisma from "../lib/prisma";

export const certificateService = {
    /**
     * Generate a branded PDF certificate for a completed process instance.
     */
    async generateCertificate(instanceId: string): Promise<string | null> {
        try {
            console.log(`[CertificateService] Generating certificate for instance ${instanceId}`);

            const instance = await prisma.processInstance.findUnique({
                where: { id: instanceId },
                include: {
                    workflow: true,
                    user: true,
                    tasks: {
                        where: { status: 'COMPLETED' },
                        orderBy: { completedAt: 'desc' }
                    }
                }
            });

            if (!instance) return null;

            const doc = new jsPDF();

            // Design Elements
            const primaryColor = "#8b5cf6"; // Purple 500
            const darkColor = "#0f172a"; // Slate 900

            // Header
            doc.setFillColor(darkColor);
            doc.rect(0, 0, 210, 40, "F");

            doc.setTextColor("#ffffff");
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("OFFICIAL APPROVAL CERTIFICATE", 105, 25, { align: "center" });

            doc.setFontSize(10);
            doc.text("NEXFLOW - AI-DRIVEN BPMS PLATFORM", 105, 33, { align: "center" });

            // Branding Section
            doc.setTextColor(primaryColor);
            doc.setFontSize(14);
            doc.text(instance.workflow.name.toUpperCase(), 20, 60);

            doc.setDrawColor(primaryColor);
            doc.setLineWidth(1);
            doc.line(20, 63, 190, 63);

            // Details
            doc.setTextColor(darkColor);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");

            const details = [
                { label: "Certificate ID:", value: instance.id },
                { label: "Initiator:", value: `${instance.user?.firstName} ${instance.user?.lastName}` },
                { label: "Workflow Type:", value: instance.workflow.name },
                { label: "Completion Date:", value: instance.tasks[0]?.completedAt?.toLocaleDateString() || new Date().toLocaleDateString() },
                { label: "Final Status:", value: "APPROVED / COMPLETED" }
            ];

            let y = 80;
            details.forEach(item => {
                doc.setFont("helvetica", "bold");
                doc.text(item.label, 20, y);
                doc.setFont("helvetica", "normal");
                doc.text(item.value || "N/A", 65, y);
                y += 12;
            });

            // Context (Dynamic Data Model)
            if (instance.context) {
                y += 10;
                doc.setFont("helvetica", "bold");
                doc.text("PROCESS DATA SUMMARY:", 20, y);
                y += 10;

                doc.setFontSize(10);
                const contextObj = instance.context as any;
                Object.entries(contextObj).forEach(([key, val]) => {
                    if (y < 250) {
                        doc.text(`${key}: ${val}`, 25, y);
                        y += 8;
                    }
                });
            }

            // Signature Section
            doc.setDrawColor("#e2e8f0");
            doc.rect(130, 230, 60, 30);
            doc.setFontSize(8);
            doc.text("DIGITAL SIGNATURE STAMP", 135, 228);
            doc.text("NEXFLOW ENGINE VERIFIED", 160, 255, { align: "center" });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor("#64748b");
            doc.text(`Generated on ${new Date().toLocaleString()} by NexFlow BPMS Core.`, 105, 285, { align: "center" });

            // Store in uploads/certificates
            const uploadDir = path.join(__dirname, "../../uploads/certificates");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `certificate_${instance.id}.pdf`;
            const filePath = path.join(uploadDir, fileName);
            const fileUrl = `/uploads/certificates/${fileName}`;

            const pdfData = doc.output("arraybuffer");
            fs.writeFileSync(filePath, Buffer.from(pdfData));

            // Save to Document table
            await prisma.document.upsert({
                where: { id: `cert_${instance.id}` }, // We use a prefix+id to ensure uniqueness for certificates
                update: {
                    fileUrl: fileUrl,
                    fileName: fileName,
                },
                create: {
                    id: `cert_${instance.id}`,
                    fileName: fileName,
                    fileUrl: fileUrl,
                    docType: 'CERTIFICATE',
                    userId: instance.userId,
                    processInstanceId: instance.id,
                    organisationId: instance.workflow.organisationId
                }
            });

            return fileUrl;
        } catch (error) {
            console.error('[CertificateService] Error generating PDF:', error);
            return null;
        }
    }
};
