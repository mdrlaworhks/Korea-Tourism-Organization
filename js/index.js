$(function () {
  $(".gnb > li").on("mouseenter", function () {
    $(this).addClass("on"); // 마우스 올린 메뉴만
    $("header").addClass("on"); // 헤더를 흰색으로
  });

  $(".gnb > li").on("mouseleave", function () {
    $(this).removeClass("on");
    $("header").removeClass("on");
  });

  /* ===== 메인 비주얼 ===== */
  const $imgs = $("#visual .slides img");
  const $tabs = $("#visual .tabs li");
  const $quick = $("#visual .quick");
  const $progress = $("#visual .progress");
  const DELAY = 6000;
  let current = 0;
  let timer;

  // n번째 슬라이드로 이동 (이미지 + 탭 + 링크 목록 함께)
  function goTo(n) {
    if (n === current) return; // 같은 번호면 무시

    $imgs.eq(current).removeClass("on").addClass("off");
    $imgs.eq(n).removeClass("off").addClass("on");

    $tabs.removeClass("on").eq(n).addClass("on");
    $quick.removeClass("on").eq(n).addClass("on");

    current = n;

    $progress.removeClass("run");
    $progress[0].offsetWidth;
    $progress.addClass("run");
  }

  function next() {
    goTo((current + 1) % $imgs.length);
  }

  function play() {
    clearInterval(timer); // 혹시 돌고 있던 타이머는 정리
    timer = setInterval(next, DELAY);
  }

  // 처음 시작
  $imgs.eq(current).addClass("on");
  $progress.addClass("run");
  play();

  // 탭 클릭
  $tabs.on("click", function (e) {
    e.preventDefault(); // href="#" 때문에 맨 위로 튀는 것 방지
    goTo($(this).index());

    // 재생 중이면 타이머를 처음부터 다시 (클릭 직후 바로 넘어가지 않게)
    if (!$("#visual").hasClass("paused")) {
      play();
    }
  });

  // 멈춤 / 재생 버튼
  $(".btn-pause").on("click", function () {
    $("#visual").toggleClass("paused");

    if ($("#visual").hasClass("paused")) {
      clearInterval(timer);
    } else {
      play();
    }
  });

  /* ===== 알림마당 배너 슬라이더 ===== */
  const $track = $(".banner-track");
  const bnTotal = $track.children("a").length;
  const BN_DELAY = 2800;
  let bnCurrent = 0;
  let bnTimer;
  let bnPaused = false;

  // 숫자를 01, 02 처럼 두 자리로
  function twoDigit(n) {
    return String(n).padStart(2, "0");
  }

  // n번째 배너로 이동
  function bnGoTo(n) {
    bnCurrent = n;
    $track.css("transform", `translateX(${-100 * n}%)`);
    $(".news-nav .now").text(twoDigit(n + 1));
    $(".btn-prev").toggleClass("disabled", n === 0); // 처음이면 이전 비활성
    $(".btn-next").toggleClass("disabled", n === bnTotal - 1); // 마지막이면 다음 비활성
  }

  // 자동재생 (3 다음엔 1로)
  function bnPlay() {
    clearInterval(bnTimer);
    if (bnPaused) return; // 멈춤 상태면 다시 돌리지 않음
    bnTimer = setInterval(function () {
      bnGoTo((bnCurrent + 1) % bnTotal);
    }, BN_DELAY);
  }

  $(".news-nav .total").text(twoDigit(bnTotal));
  bnGoTo(0);

  // 이전 / 다음
  $(".btn-prev").on("click", function () {
    if ($(this).hasClass("disabled")) return;
    bnGoTo(bnCurrent - 1);
    bnPlay(); // 타이머 처음부터 다시
  });
  $(".btn-next").on("click", function () {
    if ($(this).hasClass("disabled")) return;
    bnGoTo(bnCurrent + 1);
    bnPlay();
  });

  // 멈춤 / 재생
  $(".btn-stop").on("click", function () {
    bnPaused = !bnPaused;
    $(".news-nav").toggleClass("paused", bnPaused);
    bnPlay(); // 멈춤이면 정리만 되고, 재생이면 다시 시작
  });

  // 마우스로 끌기
  let startX = 0;
  let moveX = 0;
  let dragging = false;

  $track.on("mousedown", function (e) {
    e.preventDefault();
    dragging = true;
    startX = e.pageX;
    moveX = 0;
    clearInterval(bnTimer); // 끄는 동안은 자동재생 멈춤
    $track.css("transition", "none"); // 마우스를 바로바로 따라오게
  });

  // 배너 밖으로 마우스가 나가도 계속 추적하려고 document에 연결
  $(document).on("mousemove", function (e) {
    if (!dragging) return;
    moveX = e.pageX - startX;

    // 양 끝에서 더 끌면 1/3만 따라옴 (고무줄 느낌)
    if (
      (bnCurrent === 0 && moveX > 0) ||
      (bnCurrent === bnTotal - 1 && moveX < 0)
    ) {
      moveX = moveX / 3;
    }
    $track.css(
      "transform",
      `translateX(calc(${-100 * bnCurrent}% + ${moveX}px))`,
    );
  });

  $(document).on("mouseup", function () {
    if (!dragging) return;
    dragging = false;
    $track.css("transition", ""); // CSS의 0.5s 전환 다시 켜기

    // 80px 이상 끌었으면 넘기고, 아니면 제자리로
    if (moveX < -80 && bnCurrent < bnTotal - 1) {
      bnGoTo(bnCurrent + 1);
    } else if (moveX > 80 && bnCurrent > 0) {
      bnGoTo(bnCurrent - 1);
    } else {
      bnGoTo(bnCurrent);
    }
    bnPlay();
  });

  // 끌기를 한 경우엔 링크로 이동하지 않게
  $track.on("click", "a", function (e) {
    if (Math.abs(moveX) > 5) e.preventDefault();
  });

  /* ===== 맨 위로 버튼 ===== */
  $(window)
    .on("scroll", function () {
      // 화면 기준 위치: 비주얼의 아래 끝 / 버튼의 위 끝
      const visualBottom = $("#visual")[0].getBoundingClientRect().bottom;
      const btnTop = $(".btn-top")[0].getBoundingClientRect().top;

      // 비주얼 아래 끝이 버튼보다 위로 올라가면 나타남
      $(".btn-top").toggleClass("show", visualBottom < btnTop);
    })
    .trigger("scroll");

  $(".btn-top").on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 500);
  });
  /* ===== 알림마당 스크롤 효과 ===== */
  let con01Shown = false; // 이미 나타났는지 기억

  $(window)
    .on("scroll", function () {
      if (con01Shown) return; // 한 번 나타났으면 더 볼 필요 없음

      const scrollBottom = $(this).scrollTop() + $(this).height();
      const conTop = $("#con01").offset().top;

      if (scrollBottom > conTop + 200) {
        con01Shown = true;
        $("#con01").addClass("show");
        bnPlay(); // 나타나는 순간 배너 자동재생 시작
      }
    })
    .trigger("scroll");
  /* ===== 주요사업 패널 ===== */
  $(".biz li").on("click", function () {
    $(this).addClass("on").siblings().removeClass("on"); // 누른 것만 펼치고 나머지는 접기
  });

  /* ===== 주요사업 스크롤 효과 ===== */
  let con02Shown = false;

  $(window)
    .on("scroll", function () {
      if (con02Shown) return;

      const scrollBottom = $(this).scrollTop() + $(this).height();
      const conTop = $("#con02").offset().top;

      if (scrollBottom > conTop + 200) {
        con02Shown = true;
        $("#con02").addClass("show");
      }
    })
    .trigger("scroll");
  /* ===== 공사참여 스크롤 효과 ===== */
  let con03Shown = false;

  $(window)
    .on("scroll", function () {
      if (con03Shown) return;

      const scrollBottom = $(this).scrollTop() + $(this).height();
      const conTop = $("#con03").offset().top;

      if (scrollBottom > conTop + 200) {
        con03Shown = true;
        $("#con03").addClass("show");
      }
    })
    .trigger("scroll");
  /* ===== 관련사이트 슬라이더 ===== */
  const $siteWrap = $(".site-wrap");
  const $siteTrack = $(".site-track");
  const $siteItems = $siteTrack.children("li");
  const SITE_DELAY = 5000;
  let siteCurrent = 0;
  let siteTimer;
  let sitePaused = false;

  // 최대로 움직일 수 있는 거리 (전체 길이 - 보이는 창 폭)
  function siteMax() {
    return Math.max(0, $siteTrack[0].scrollWidth - $siteWrap.width());
  }

  // n번째 항목까지 가려면 움직일 거리 (끝을 넘지 않게)
  function sitePos(n) {
    return Math.min($siteItems[n].offsetLeft, siteMax());
  }

  // 마지막 항목들이 다 보이는 첫 번호 = 실제로 갈 수 있는 마지막 칸
  function siteLast() {
    const max = siteMax();
    for (let i = 0; i < $siteItems.length; i++) {
      if ($siteItems[i].offsetLeft >= max) return i;
    }
    return $siteItems.length - 1;
  }

  // n번째 항목으로 이동
  function siteGoTo(n) {
    siteCurrent = n;
    $siteTrack.css("transform", `translateX(${-sitePos(n)}px)`);
    $(".site-prev").toggleClass("disabled", n === 0);
    $(".site-next").toggleClass("disabled", n === siteLast());
  }

  // 자동재생 (끝에 닿으면 처음으로)
  function sitePlay() {
    clearInterval(siteTimer);
    if (sitePaused) return;
    siteTimer = setInterval(function () {
      siteGoTo(siteCurrent >= siteLast() ? 0 : siteCurrent + 1);
    }, SITE_DELAY);
  }

  siteGoTo(0);
  sitePlay();

  // 이전 / 다음
  $(".site-prev").on("click", function () {
    if ($(this).hasClass("disabled")) return;
    siteGoTo(siteCurrent - 1);
    sitePlay(); // 타이머 처음부터 다시
  });
  $(".site-next").on("click", function () {
    if ($(this).hasClass("disabled")) return;
    siteGoTo(siteCurrent + 1);
    sitePlay();
  });

  // 멈춤 / 재생
  $(".site-stop").on("click", function () {
    sitePaused = !sitePaused;
    $(".site-nav").toggleClass("paused", sitePaused);
    sitePlay(); // 멈춤이면 정리만 되고, 재생이면 다시 시작
  });

  // 마우스로 끌기
  let siteStartX = 0;
  let siteMoveX = 0;
  let siteDragging = false;

  $siteTrack.on("mousedown", function (e) {
    e.preventDefault(); // 링크가 따로 끌려 나오는 것 방지
    siteDragging = true;
    siteStartX = e.pageX;
    siteMoveX = 0;
    clearInterval(siteTimer);
    $siteTrack.css("transition", "none");
  });

  $(document).on("mousemove", function (e) {
    if (!siteDragging) return;
    siteMoveX = e.pageX - siteStartX;

    // 양 끝에서 더 끌면 1/3만 따라옴 (고무줄 느낌)
    const pos = sitePos(siteCurrent) - siteMoveX;
    if (pos < 0 || pos > siteMax()) {
      siteMoveX = siteMoveX / 3;
    }
    $siteTrack.css(
      "transform",
      `translateX(${-sitePos(siteCurrent) + siteMoveX}px)`,
    );
  });

  $(document).on("mouseup", function () {
    if (!siteDragging) return;
    siteDragging = false;
    $siteTrack.css("transition", "");

    // 놓은 위치에서 가장 가까운 항목 찾기
    const pos = sitePos(siteCurrent) - siteMoveX;
    const last = siteLast();
    let target = siteCurrent;
    let gap = Infinity;
    for (let i = 0; i <= last; i++) {
      const d = Math.abs(sitePos(i) - pos);
      if (d < gap) {
        gap = d;
        target = i;
      }
    }

    // 조금(50px 이상) 끌었는데 제자리면 한 칸은 넘겨주기
    if (target === siteCurrent && Math.abs(siteMoveX) > 50) {
      if (siteMoveX < 0 && siteCurrent < last) target++;
      if (siteMoveX > 0 && siteCurrent > 0) target--;
    }

    siteGoTo(target);
    sitePlay();
  });

  // 끌었을 땐 링크 이동 막기
  $siteTrack.on("click", "a", function (e) {
    if (Math.abs(siteMoveX) > 5) e.preventDefault();
  });

  // 창 크기가 바뀌면 위치 다시 맞추기
  $(window).on("resize", function () {
    siteGoTo(Math.min(siteCurrent, siteLast()));
  });
});
