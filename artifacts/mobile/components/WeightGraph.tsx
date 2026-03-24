import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { Colors } from "@/constants/colors";
import type { WeightEntry } from "@/types";

type Props = {
  entries: WeightEntry[];
  width?: number;
  height?: number;
};

export function WeightGraph({ entries, width = 320, height = 160 }: Props) {
  if (entries.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>
          {entries.length === 0
            ? "No weight logged yet"
            : "Log one more day to see your graph"}
        </Text>
      </View>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const weights = sorted.map((e) => e.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;

  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const graphW = width - padL - padR;
  const graphH = height - padT - padB;

  const toX = (i: number) => padL + (i / (sorted.length - 1)) * graphW;
  const toY = (w: number) => padT + (1 - (w - minW) / range) * graphH;

  const points = sorted
    .map((e, i) => `${toX(i)},${toY(e.weight)}`)
    .join(" ");

  const yLabels = [minW + 2, (minW + maxW) / 2, maxW - 2].map(Math.round);

  const getDateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const firstEntry = sorted[0];
  const lastEntry = sorted[sorted.length - 1];
  const diff = lastEntry.weight - firstEntry.weight;
  const trending = diff < -0.5 ? "down" : diff > 0.5 ? "up" : "flat";
  const trendColor =
    trending === "down" ? Colors.success : trending === "up" ? Colors.accent : Colors.warning;

  return (
    <View>
      <Svg width={width} height={height}>
        {yLabels.map((y) => (
          <React.Fragment key={y}>
            <Line
              x1={padL}
              y1={toY(y)}
              x2={width - padR}
              y2={toY(y)}
              stroke={Colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={padL - 4}
              y={toY(y) + 4}
              textAnchor="end"
              fill={Colors.textMuted}
              fontSize={9}
              fontFamily="Inter_400Regular"
            >
              {y}
            </SvgText>
          </React.Fragment>
        ))}

        <Polyline
          points={points}
          fill="none"
          stroke={trendColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {sorted.map((e, i) => (
          <Circle
            key={e.id}
            cx={toX(i)}
            cy={toY(e.weight)}
            r={4}
            fill={trendColor}
            stroke={Colors.bg}
            strokeWidth={1.5}
          />
        ))}

        {[0, sorted.length - 1].map((i) => (
          <SvgText
            key={i}
            x={toX(i)}
            y={height - padB + 14}
            textAnchor={i === 0 ? "start" : "end"}
            fill={Colors.textMuted}
            fontSize={9}
            fontFamily="Inter_400Regular"
          >
            {getDateLabel(sorted[i].date)}
          </SvgText>
        ))}
      </Svg>

      <View style={styles.trendRow}>
        <Text style={[styles.trendText, { color: trendColor }]}>
          {trending === "down"
            ? `Down ${Math.abs(diff).toFixed(1)} lbs`
            : trending === "up"
              ? `Up ${diff.toFixed(1)} lbs`
              : "Holding steady"}
        </Text>
        <Text style={styles.trendSub}>
          {firstEntry ? `from ${getDateLabel(firstEntry.date)}` : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  trendSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
});
