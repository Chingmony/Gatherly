package com.gatherly.common.paging;

import static org.assertj.core.api.Assertions.assertThat;

import com.gatherly.dto.attendance.SubmissionSort;
import com.gatherly.dto.event.EventSort;
import com.gatherly.dto.material.MaterialSort;
import com.gatherly.dto.supply.SupplyItemSort;
import com.gatherly.dto.user.UserSort;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Unit tests for the standardized paging/sorting helper and the per-domain sort enums: default sort,
 * page/size clamping, the size cap, and field whitelisting. No Spring context required.
 */
class PageRequestsTest {

  @Test
  void buildsPageableWithRequestedValuesAndSort() {
    Pageable p = PageRequests.of(2, 30, UserSort.EMAIL, Sort.Direction.DESC);
    assertThat(p.getPageNumber()).isEqualTo(2);
    assertThat(p.getPageSize()).isEqualTo(30);
    assertThat(p.getSort().getOrderFor("email")).isNotNull();
    assertThat(p.getSort().getOrderFor("email").getDirection()).isEqualTo(Sort.Direction.DESC);
  }

  @Test
  void negativePageClampsToZero() {
    assertThat(PageRequests.of(-5, 20, UserSort.NAME, Sort.Direction.ASC).getPageNumber())
        .isZero();
  }

  @Test
  void nonPositiveSizeFallsBackToDefault() {
    assertThat(PageRequests.of(0, 0, UserSort.NAME, Sort.Direction.ASC).getPageSize())
        .isEqualTo(PageRequests.DEFAULT_SIZE);
  }

  @Test
  void oversizedSizeIsCappedToMax() {
    assertThat(PageRequests.of(0, 5000, UserSort.NAME, Sort.Direction.ASC).getPageSize())
        .isEqualTo(PageRequests.MAX_SIZE);
  }

  @Test
  void enumsMapToWhitelistedEntityProperties() {
    assertThat(orderProperty(UserSort.NAME)).isEqualTo("fullName");
    assertThat(orderProperty(SupplyItemSort.NAME)).isEqualTo("name");
    assertThat(orderProperty(EventSort.DATE)).isEqualTo("startsAt");
    assertThat(orderProperty(MaterialSort.NAME)).isEqualTo("name");
    assertThat(orderProperty(SubmissionSort.DATE)).isEqualTo("submittedAt");
  }

  @Test
  void documentedDefaultIsTheFirstEnumConstant() {
    // Controllers use the first constant as the @RequestParam defaultValue.
    assertThat(UserSort.values()[0]).isEqualTo(UserSort.NAME);
    assertThat(SupplyItemSort.values()[0]).isEqualTo(SupplyItemSort.NAME);
    assertThat(EventSort.values()[0]).isEqualTo(EventSort.DATE);
    assertThat(MaterialSort.values()[0]).isEqualTo(MaterialSort.NAME);
    assertThat(SubmissionSort.values()[0]).isEqualTo(SubmissionSort.DATE);
  }

  private static String orderProperty(SortField field) {
    Sort sort = field.toSort(Sort.Direction.ASC);
    return sort.iterator().next().getProperty();
  }
}
