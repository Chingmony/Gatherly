package com.gatherly.integration.qr;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Renders an opaque {@code checkin_token} to a QR-code PNG ({@code docs/04} §2.1, ZXing per {@code
 * docs/06} §10). The token — not a URL — is the scan payload; the organizer app resolves it
 * server-side.
 */
@Service
public class QrService {

  public byte[] renderPng(String content, int sizePx) {
    try {
      BitMatrix matrix =
          new MultiFormatWriter()
              .encode(
                  content, BarcodeFormat.QR_CODE, sizePx, sizePx, Map.of(EncodeHintType.MARGIN, 1));
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(matrix, "PNG", out);
      return out.toByteArray();
    } catch (WriterException | IOException e) {
      throw new IllegalStateException("Failed to render QR code", e);
    }
  }
}
