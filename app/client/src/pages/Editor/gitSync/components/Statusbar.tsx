import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Wrapper = styled.div<{ active: boolean }>`
  position: relative;
  width: 100%;
  background-color: ${(props) =>
    props.active ? props.theme.colors.welcomeTourStickySidebarBackground : ""};
  cursor: ${(props) => (props.active ? "default" : "pointer")};
  height: ${(props) => props.theme.onboarding.statusBarHeight}px;
  transition: background-color 0.3s ease;

  ${(props) =>
    props.active &&
    `
      p {
        color: ${Colors.WHITE};
      }
      svg {
        fill: ${Colors.WHITE};
      }
  `}

  &:hover .hover-icons {
    opacity: 1;
  }
`;

const StatusText = styled.p`
  color: ${Colors.BLACK};
  font-size: 12px;
  line-height: 12px;
  margin-top: ${(props) => props.theme.spaces[3]}px;
  & .hover-icons {
    transform: translate(3px, 0px);
    opacity: 0;
  }
`;

const ProgressContainer = styled.div`
  background-color: rgb(0, 0, 0, 0.2);
  overflow: hidden;
  margin-top: 12px;
`;

const Progressbar = styled.div<StatusProgressbarType>`
  width: ${(props) => props.percentage}%;
  height: 8px;
  background: ${(props) =>
    props.active
      ? Colors.WHITE
      : props.theme.colors.welcomeTourStickySidebarBackground};
  transition: width 0.3s ease, background 0.3s ease;
`;

type StatusProgressbarType = {
  percentage: number;
  active: boolean;
};

export function StatusProgressbar(props: StatusProgressbarType) {
  return (
    <ProgressContainer>
      <Progressbar {...props} />
    </ProgressContainer>
  );
}

type StatusbarProps = {
  completed: boolean;
  period: number; // as seconds
  message?: string;
  onHide?: () => void;
};

export default function OnboardingStatusbar(props: StatusbarProps) {
  const { completed, message, period } = props;
  const [percentage, setPercentage] = useState(0);
  useEffect(() => {
    if (completed) {
      setPercentage(100);
      if (props.onHide) {
        setTimeout(() => {
          props.onHide && props.onHide();
        }, 1000);
      }
    } else {
      if (percentage < 90) {
        const interval = setInterval(() => {
          setPercentage((percentage) => percentage + 10);
        }, (period * 1000) / 9);
        return () => clearInterval(interval);
      }
    }
  });
  return (
    <Wrapper active={false} data-testid="statusbar-container">
      <StatusProgressbar
        active={false}
        data-testid="statusbar-text"
        percentage={percentage}
      />
      <StatusText>
        <span data-testid="statusbar-text">
          {percentage}% {message}
        </span>
      </StatusText>
    </Wrapper>
  );
}
