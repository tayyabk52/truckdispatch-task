import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import InfoTooltip from "./InfoTooltip";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  help?: React.ReactNode;
  icon?: React.ReactNode;
  /** Right-aligned header actions. */
  action?: React.ReactNode;
  /** Remove inner padding (useful for maps / full-bleed content). */
  disablePadding?: boolean;
  /** Optional presentation overrides for a page-specific use of the section. */
  cardSx?: SxProps<Theme>;
  children: React.ReactNode;
  className?: string;
}

/**
 * A titled content card with a consistent header row. Flatter, clean Google style.
 */
export default function SectionCard({
  title,
  subtitle,
  help,
  icon,
  action,
  disablePadding,
  cardSx,
  children,
  className,
}: SectionCardProps) {
  const hasHeader = Boolean(title || action);
  
  const baseCardSx: SxProps<Theme> = {
    height: "100%",
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "#ffffff",
    boxShadow: "none",
    overflow: "hidden",
  };

  const resolvedCardSx =
    cardSx === undefined
      ? baseCardSx
      : Array.isArray(cardSx)
        ? [baseCardSx, ...cardSx]
        : [baseCardSx, cardSx];

  return (
    <Card className={className} sx={resolvedCardSx}>
      {hasHeader && (
        <>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              bgcolor: "#ffffff",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {icon && (
                  <Box
                    sx={{
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "& .MuiSvgIcon-root": { fontSize: 18 },
                    }}
                  >
                    {icon}
                  </Box>
                )}
                {title && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary" }} noWrap>
                    {title}
                  </Typography>
                )}
                {help && <InfoTooltip title={help} size={14} />}
              </Stack>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.15, display: "block", fontSize: "0.78rem" }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
          </Stack>
          <Divider sx={{ opacity: 0.6 }} />
        </>
      )}
      <CardContent
        sx={
          disablePadding
            ? { p: 0, "&:last-child": { pb: 0 } }
            : { p: { xs: 2, sm: 2.5 } }
        }
      >
        {children}
      </CardContent>
    </Card>
  );
}


