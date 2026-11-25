declare module 'html-pdf-node' {
  namespace htmlPdf {
    interface HtmlPdfFile {
      content?: string;
      url?: string;
    }

    function generatePdf(
      file: HtmlPdfFile,
      options?: Record<string, unknown>,
    ): Promise<Buffer>;
  }

  export = htmlPdf;
}
