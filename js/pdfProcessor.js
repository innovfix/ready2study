// PDF Processing using PDF.js
// This script extracts text content from uploaded PDF files

class PDFProcessor {
    constructor() {
        this.pdfjsLib = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized && this.pdfjsLib) return;
        
        // Load PDF.js from CDN
        if (typeof pdfjsLib === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                    if (typeof pdfjsLib !== 'undefined') {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        this.pdfjsLib = pdfjsLib;
                        this.initialized = true;
                        resolve();
                    } else {
                        reject(new Error('PDF.js failed to load'));
                    }
                };
                script.onerror = () => reject(new Error('Failed to load PDF.js'));
                document.head.appendChild(script);
            });
        } else {
            this.pdfjsLib = pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            this.initialized = true;
        }
    }

    async extractTextFromPDF(file) {
        await this.initialize();
        
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await this.pdfjsLib.getDocument({ data: typedArray }).promise;
                    const numPages = pdf.numPages;
                    let fullText = '';
                    const extractedImages = [];

                    // Extract text from ALL pages - ensuring complete PDF reading
                    console.log(`Reading PDF: ${numPages} pages total`);
                    
                    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                        try {
                            const page = await pdf.getPage(pageNum);
                            const textContent = await page.getTextContent();
                            
                            // Better text extraction with spacing preservation
                            let pageText = '';
                            let lastY = null;
                            
                            textContent.items.forEach((item, index) => {
                                // Add line break if Y position changed significantly (new line)
                                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                                    pageText += '\n';
                                }
                                
                                // Add space between words on same line
                                if (index > 0 && textContent.items[index - 1].transform[4] < item.transform[4] - 5) {
                                    pageText += ' ';
                                }
                                
                                pageText += item.str;
                                lastY = item.transform[5];
                            });
                            
                            fullText += `\n--- Page ${pageNum} of ${numPages} ---\n\n${pageText}\n\n`;
                            
                            // Extract images from page (if available)
                            try {
                                const opList = await page.getOperatorList();
                                const imagePromises = [];
                                
                                // Look for image operators in the page
                                for (let i = 0; i < opList.fnArray.length; i++) {
                                    if (opList.fnArray[i] === this.pdfjsLib.OPS.paintImageXObject) {
                                        const imageName = opList.argsArray[i][0];
                                        imagePromises.push(
                                            page.objs.get(imageName).then(function(img) {
                                                if (img && img.data) {
                                                    return img.data;
                                                }
                                                return null;
                                            }).catch(function() {
                                                return null;
                                            })
                                        );
                                    }
                                }
                                
                                // Convert images to data URLs
                                const pageImages = await Promise.all(imagePromises);
                                pageImages.forEach(function(imgData) {
                                    if (imgData) {
                                        try {
                                            const canvas = document.createElement('canvas');
                                            const ctx = canvas.getContext('2d');
                                            canvas.width = imgData.width;
                                            canvas.height = imgData.height;
                                            ctx.putImageData(imgData, 0, 0);
                                            const dataUrl = canvas.toDataURL('image/png');
                                            extractedImages.push({
                                                page: pageNum,
                                                dataUrl: dataUrl,
                                                width: imgData.width,
                                                height: imgData.height
                                            });
                                        } catch (imgError) {
                                            console.warn('Error processing image:', imgError);
                                        }
                                    }
                                });
                            } catch (imgExtractError) {
                                // Images extraction is optional, continue if it fails
                                console.log('Image extraction not available for this PDF');
                            }
                            
                            // Log progress for large PDFs
                            if (pageNum % 10 === 0 || pageNum === numPages) {
                                console.log(`Processed ${pageNum}/${numPages} pages`);
                            }
                        } catch (pageError) {
                            console.warn(`Error reading page ${pageNum}:`, pageError);
                            // Continue with other pages even if one fails
                        }
                    }

                    console.log(`PDF reading complete. Total text length: ${fullText.length} characters. Images found: ${extractedImages.length}`);
                    resolve({
                        text: fullText.trim(),
                        images: extractedImages
                    });
                } catch (error) {
                    reject(error);
                }
            };

            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
        });
    }

    async processPDF(file) {
        try {
            const result = await this.extractTextFromPDF(file);
            const text = typeof result === 'string' ? result : result.text;
            const images = result.images || [];
            
            // Clean and normalize the text
            const cleanedText = this.cleanText(text);
            
            // Extract topics and structure
            const topics = this.extractTopics(cleanedText);
            
            return {
                success: true,
                text: cleanedText,
                fileName: file.name,
                topics: topics,
                images: images,
                wordCount: cleanedText.split(/\s+/).length
            };
        } catch (error) {
            console.error('Error processing PDF:', error);
            return {
                success: false,
                error: error.message,
                text: '',
                topics: [],
                images: []
            };
        }
    }

    cleanText(text) {
        // Remove excessive whitespace
        let cleaned = text.replace(/\s+/g, ' ');
        // Remove page markers
        cleaned = cleaned.replace(/--- Page \d+ ---/g, '');
        // Normalize line breaks
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        // Remove special characters that might interfere
        cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        return cleaned.trim();
    }

    extractTopics(text) {
        const sections = [];
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        // Enhanced title/heading detection patterns
        const headingPatterns = [
            /^(Chapter|Section|Topic|Unit|Part|Module)\s+\d+[\.\)]?\s*:?\s*(.+)$/i,
            /^\d+[\.\)]\s+(.+)$/,  // Numbered headings like "1. Introduction"
            /^[A-Z][A-Z\s]{2,50}(?:\n|$)/m,  // ALL CAPS headings
            /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*:)?$/m,  // Title Case headings
            /^[A-Z][^.!?]{5,80}(?:\n|$)/m  // Capitalized short lines
        ];

        let currentSection = null;
        let currentContent = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            let isHeading = false;
            let headingTitle = null;

            // Check if line matches heading patterns
            for (const pattern of headingPatterns) {
                const match = trimmed.match(pattern);
                if (match) {
                    // Extract title from match
                    headingTitle = match[2] || match[1] || trimmed;
                    
                    // Validate it's actually a heading (not too long, doesn't end with period)
                    if (headingTitle.length < 100 && 
                        !headingTitle.match(/[.!?]$/) &&
                        headingTitle.length > 3) {
                        isHeading = true;
                        break;
                    }
                }
            }

            // Additional checks for headings
            if (!isHeading) {
                // Check for common heading indicators
                if (trimmed.length > 3 && trimmed.length < 80 &&
                    !trimmed.match(/[.!?]$/) &&
                    (trimmed.match(/^[A-Z]/) || trimmed.match(/^\d+[\.\)]/)) &&
                    index < lines.length - 1) {
                    // Check if next line is content (not another heading)
                    const nextLine = lines[index + 1]?.trim() || '';
                    if (nextLine.length > 20 && !nextLine.match(/^[A-Z][^.!?]{0,50}$/)) {
                        isHeading = true;
                        headingTitle = trimmed;
                    }
                }
            }

            if (isHeading && headingTitle) {
                // Save previous section if exists
                if (currentSection) {
                    sections.push({
                        title: currentSection,
                        content: currentContent.join('\n').trim(),
                        startLine: currentSection.startLine || 0,
                        endLine: index
                    });
                }

                // Start new section
                currentSection = headingTitle;
                currentContent = [];
            } else {
                // Add to current section content
                if (currentSection) {
                    currentContent.push(trimmed);
                } else {
                    // If no section started, check if this might be the first heading
                    if (trimmed.length > 5 && trimmed.length < 100 && 
                        !trimmed.match(/[.!?]$/) &&
                        trimmed.match(/^[A-Z]/)) {
                        currentSection = trimmed;
                        currentContent = [];
                    } else {
                        // Add to a default section
                        if (!currentSection) {
                            currentSection = 'Introduction';
                        }
                        currentContent.push(trimmed);
                    }
                }
            }
        });

        // Save last section
        if (currentSection && currentContent.length > 0) {
            sections.push({
                title: currentSection,
                content: currentContent.join('\n').trim(),
                startLine: 0,
                endLine: lines.length
            });
        }

        // If no sections found, split by major paragraphs
        if (sections.length === 0) {
            const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
            paragraphs.forEach((para, idx) => {
                const sentences = para.split(/[.!?]/);
                const firstSentence = sentences[0]?.trim() || '';
                
                if (firstSentence.length > 10 && firstSentence.length < 100) {
                    sections.push({
                        title: firstSentence,
                        content: para.trim(),
                        startLine: idx,
                        endLine: idx
                    });
                } else {
                    sections.push({
                        title: `Section ${idx + 1}`,
                        content: para.trim(),
                        startLine: idx,
                        endLine: idx
                    });
                }
            });
        }

        return sections;
    }

    getTopicContent(fullText, topicIndex, lines) {
        // Get content for a topic (next few paragraphs or lines)
        const startIdx = Math.min(topicIndex + 1, lines.length - 1);
        const endIdx = Math.min(topicIndex + 10, lines.length);
        return lines.slice(startIdx, endIdx).join(' ').substring(0, 1000);
    }
}

// Export for use in other scripts
window.PDFProcessor = PDFProcessor;

