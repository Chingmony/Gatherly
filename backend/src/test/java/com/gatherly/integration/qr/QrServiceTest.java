package com.gatherly.integration.qr;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;

import static org.assertj.core.api.Assertions.assertThat;

/** The QR PNG must be a valid image that decodes back to the exact check-in token (docs/06 §6). */
class QrServiceTest {

    private final QrService qr = new QrService();

    @Test
    void rendersPngThatDecodesBackToTheToken() throws Exception {
        String token = "tkt_9c1bAbCdEf-1234567890_XyZ";
        byte[] png = qr.renderPng(token);

        // Valid PNG (8-byte signature) and non-trivial.
        assertThat(png).hasSizeGreaterThan(100);
        assertThat(new byte[] {png[0], png[1], png[2], png[3]})
                .containsExactly((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47); // ‰PNG

        // Round-trip: decode the rendered QR and confirm it carries the token verbatim.
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(png));
        assertThat(image).isNotNull();
        BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
        Result decoded = new MultiFormatReader().decode(bitmap);
        assertThat(decoded.getText()).isEqualTo(token);
    }
}
