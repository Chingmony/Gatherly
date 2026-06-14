package com.gatherly.integration.qr;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Map;

/**
 * Renders the opaque {@code checkin_token} to a QR PNG (docs/06 §10 default = ZXing) for inline-CID
 * embedding in the QR-ticket email (docs/04 §2.1). The token — not a public URL — is the scan
 * payload; the organizer app resolves it server-side on scan (M7). Pure/stateless.
 */
@Service
public class QrService {

    private static final int DEFAULT_SIZE = 320;

    /** Encode {@code token} as a square QR PNG of the default size. */
    public byte[] renderPng(String token) {
        return renderPng(token, DEFAULT_SIZE);
    }

    public byte[] renderPng(String token, int size) {
        try {
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.MARGIN, 1,
                    EncodeHintType.CHARACTER_SET, "UTF-8");
            BitMatrix matrix = new QRCodeWriter().encode(token, BarcodeFormat.QR_CODE, size, size, hints);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (WriterException e) {
            // Should not happen for a well-formed token; surface clearly rather than send a blank QR.
            throw new IllegalStateException("Failed to encode QR for the check-in token.", e);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write QR PNG.", e);
        }
    }
}
